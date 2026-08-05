"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  FileText,
  Bell,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import BrandLogo from "@/components/brand-logo";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo
              variant="full"
              size="md"
              tagline="Your warranty. Our responsibility."
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Features
            </a>
            <Link
              href="/login"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              Get started
            </Link>
          </nav>

          <button
            type="button"
            className="rounded-xl border border-white/10 p-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 px-5 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-gray-300"
              >
                Features
              </a>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-gray-300"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-white px-3 py-2.5 text-center text-sm font-semibold text-black"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center md:px-8 md:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300/80">
            Your warranty. Our responsibility.
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Never lose track of a warranty again
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-500 md:text-base">
            Store invoices, track expiry dates, and get reminders — in a simple
            vault built for everyday use.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              Create free account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Simple tools. Clear protection.
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Everything you need — nothing confusing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <FileText size={18} />,
              title: "Document storage",
              desc: "Keep invoices and warranty cards organized for every product.",
            },
            {
              icon: <Bell size={18} />,
              title: "Smart reminders",
              desc: "Get notified before coverage expires so nothing slips by.",
            },
            {
              icon: <Sparkles size={18} />,
              title: "Document scanning",
              desc: "Upload an invoice or warranty card and auto-fill available fields.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
