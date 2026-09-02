"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";

import AuthShell, {
  AuthBrandMark,
  AuthLegalFooter,
  authInputClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-shell";
import EmailOtpForm from "@/components/email-otp-form";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { safeAuthCallbackUrl } from "@/lib/auth-callback";
import { registerSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell showHomeLink={false}>
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-white/40" size={20} />
          </div>
        </AuthShell>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackUrl(searchParams.get("callbackUrl"));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"password" | "otp">("password");

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = useWatch({ control, name: "password" }) || "";

  async function onSubmit(data: {
    name: string;
    email: string;
    password: string;
  }) {
    try {
      setLoading(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Could not create account");
        return;
      }

      toast.success("Account created — signing you in…");

      const login = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (login?.error) {
        toast.message("Account created. Please sign in.");
        router.push(
          callbackUrl !== "/dashboard"
            ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/login"
        );
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Create a Warranty Vault account
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Already have an account?{" "}
          <Link
            href={
              callbackUrl !== "/dashboard"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login"
            }
            className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white/60"
          >
            Log in.
          </Link>
        </p>
      </div>

      <div className="mt-8">
        {mode === "password" ? (
          <div className="space-y-5">
            <SocialAuthButtons
              mode="signup"
              callbackUrl={callbackUrl}
              onUseOtp={() => setMode("otp")}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  autoFocus
                  placeholder="Alan Turing"
                  className={authInputClass}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-400">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alan.turing@example.com"
                  className={authInputClass}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-400">
                    {String(errors.email.message)}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className={`${authInputClass} pr-11`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs ${
                    password.length >= 8 ? "text-white/70" : "text-white/30"
                  }`}
                >
                  <Check size={12} />
                  At least 8 characters
                </p>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-400">
                    {String(errors.password.message)}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className={authPrimaryButtonClass}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>
        ) : (
          <EmailOtpForm
            callbackUrl={callbackUrl}
            onBack={() => setMode("password")}
          />
        )}
      </div>

      <AuthLegalFooter action="up" />
    </AuthShell>
  );
}
