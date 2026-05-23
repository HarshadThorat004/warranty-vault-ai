"use client";

import { useState } from "react";

import Link from "next/link";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        toast.error(
          "Invalid credentials"
        );

        return;
      }

      toast.success(
        "Logged in successfully"
      );

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-black">
          Login
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Welcome back to WarrantyVault AI
        </p>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-black hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}