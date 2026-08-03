"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import BackgroundGlow from "@/components/background-glow";
import { registerSchema } from "@/lib/validations/auth";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/60";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password") || "";

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
        router.push("/login");
        return;
      }

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

      <div className="relative z-10 mx-auto grid min-h-screen max-w-5xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-r border-white/5 p-10 lg:flex lg:p-14">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-black">
              <ShieldCheck size={18} />
            </div>
            <span className="text-sm font-semibold">Warranty Vault AI</span>
          </Link>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300/80">
              Your warranty. Our responsibility.
            </p>
            <h1 className="mt-5 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Keep every purchase protected.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-gray-500">
              Store invoices, track expiry dates, and get reminders before
              coverage ends.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Scan invoices to auto-fill details",
                "Expiry reminders you can trust",
                "Documents and notes in one place",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-gray-300"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-300 hover:underline">
              Sign in
            </Link>
          </p>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-black">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-sm font-semibold">Warranty Vault AI</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                Create account
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Just three fields — then you&apos;re ready.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-7 space-y-4"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm text-gray-400"
                  >
                    Your name
                  </label>
                  <input
                    id="name"
                    autoComplete="name"
                    autoFocus
                    placeholder="e.g. Aditya"
                    className={inputClass}
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
                    className="mb-1.5 block text-sm text-gray-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    className={inputClass}
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
                    className="mb-1.5 block text-sm text-gray-400"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      className={`${inputClass} pr-11`}
                      {...register("password")}
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
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs ${
                      password.length >= 6 ? "text-cyan-300" : "text-gray-600"
                    }`}
                  >
                    <Check size={12} />
                    At least 6 characters
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="font-medium text-cyan-300 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
