"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";

import BackgroundGlow from "@/components/background-glow";
import EmailOtpForm from "@/components/email-otp-form";
import SocialAuthButtons from "@/components/social-auth-buttons";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/60";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen overflow-hidden bg-black text-white">
          <BackgroundGlow />
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <Loader2 className="animate-spin text-gray-500" size={20} />
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "otp">("password");

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    if (error === "OAuthCallback" || error === "OAuthSignin" || error === "google") {
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
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <BackgroundGlow />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-black">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">Warranty Vault AI</p>
            <p className="text-[11px] text-gray-500">
              Your warranty. Our responsibility.
            </p>
          </div>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-gray-500">
            Use Google, email code, or your password to sign in.
          </p>

          <div className="mt-7 space-y-5">
            {mode === "password" ? (
              <>
                <SocialAuthButtons
                  mode="signin"
                  onUseOtp={() => setMode("otp")}
                />

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm text-gray-400"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm text-gray-400"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
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
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <EmailOtpForm onBack={() => setMode("password")} />
            )}
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-medium text-cyan-300 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
