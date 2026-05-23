import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <div className="mb-6 text-7xl">
          🔍
        </div>

        <h1 className="text-5xl font-bold">
          404
        </h1>

        <p className="mt-4 text-lg text-gray-400">
          The page you are looking for
          does not exist.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}