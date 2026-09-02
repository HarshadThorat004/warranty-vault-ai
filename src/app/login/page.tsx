"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import AuthShell, {
  AuthBrandMark,
  AuthLegalFooter,
  authInputClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-shell";
import EmailOtpForm from "@/components/email-otp-form";
import SocialAuthButtons from "@/components/social-auth-buttons";
import { safeAuthCallbackUrl } from "@/lib/auth-callback";

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "otp">("password");

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    if (
      error === "OAuthCallback" ||
      error === "OAuthSignin" ||
      error === "google"
    ) {
      toast.error(
        "Google sign-in failed. Open the app at http://localhost:3000 (not 127.0.0.1) and try again."
      );
      return;
    }

    toast.error("Sign-in failed. Please try again.");
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          result.error.includes("Too many")
            ? result.error
            : "Invalid email or password"
        );
        return;
      }

      toast.success("Welcome back");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <AuthShell>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">
          Log in to Warranty Vault
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Don&apos;t have an account?{" "}
          <Link
            href={
              callbackUrl !== "/dashboard"
                ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/register"
            }
            className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white/60"
          >
            Sign up.
          </Link>
        </p>
      </div>

      <div className="mt-8">
        {mode === "password" ? (
          <div className="space-y-5">
            <SocialAuthButtons
              mode="signin"
              callbackUrl={callbackUrl}
              onUseOtp={() => setMode("otp")}
            />

            <form onSubmit={handleLogin} className="space-y-4">
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
                  autoFocus
                  placeholder="alan.turing@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={authInputClass}
                />
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
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${authInputClass} pr-11`}
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
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={authPrimaryButtonClass}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Log In"
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

      <AuthLegalFooter action="in" />
    </AuthShell>
  );
}
