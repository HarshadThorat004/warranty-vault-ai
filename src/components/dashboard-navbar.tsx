"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";

import BrandLogo from "@/components/brand-logo";
import NotificationPanel, {
  type NotificationItem,
} from "@/components/notification-panel";

type Props = {
  name?: string | null;
  initialNotifications?: NotificationItem[];
};

export default function DashboardNavbar({
  name,
  initialNotifications = [],
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <BrandLogo
            variant="full"
            size="md"
            tagline={name ? `Hi, ${name.split(" ")[0]}` : "Warranty manager"}
          />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NotificationPanel initialItems={initialNotifications} />

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/add-product"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
          >
            <Plus size={16} />
            Add product
          </Link>

          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            <Settings size={16} />
            Settings
          </Link>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-sm text-gray-400 transition hover:border-red-500/30 hover:text-red-300"
            aria-label="Logout"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <NotificationPanel initialItems={initialNotifications} />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-white/10 p-2 text-white"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/95 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/add-product"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              Add product
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/10"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
