"use client";

import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { toast } from "sonner";

import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      registerSchema
    ),
  });

  async function onSubmit(data: any) {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "Account created successfully"
      );

      router.push("/login");
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
          Create Account
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Start managing your
          warranties intelligently.
        </p>

        <form
          onSubmit={handleSubmit(
            onSubmit
          )}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              placeholder="Full Name"
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black"
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {String(
                  errors.name.message
                )}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {String(
                  errors.email.message
                )}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register(
                "password"
              )}
              className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {String(
                  errors.password
                    .message
                )}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an
          account?{" "}
          <Link
            href="/login"
            className="font-semibold text-black hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}