"use client";

import Link from "next/link";

import { signOut } from "next-auth/react";

type Props = {
  name?: string | null;
};

export default function Navbar({
  name,
}: Props) {
  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        
        <Link
          href={name ? "/dashboard" : "/"}
          className="text-2xl font-bold text-white"
        >
          Warranty Vault AI
        </Link>

        <div className="flex items-center gap-4">
          
          {name && (
            <div className="hidden text-sm font-medium text-white md:block">
              {name}
            </div>
          )}

          {name ? (
            <button
              onClick={() =>
                signOut({
                  callbackUrl: "/login",
                })
              }
              className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-red-500 hover:bg-red-500"
            >
              Logout
            </button>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-gray-500"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}