"use client";

import Link from "next/link";

type Props = {
  error: Error;
  reset: () => void;
};

export default function Error({
  error,
  reset,
}: Props) {
  console.error(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="max-w-md text-center">
        <div className="mb-6 text-7xl">
          ⚠️
        </div>

        <h1 className="text-4xl font-bold">
          Something went wrong
        </h1>

        <p className="mt-4 text-gray-400">
          An unexpected error occurred.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
          >
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-700 px-6 py-3 transition hover:bg-neutral-900"
          >
            Go Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}