import Link from "next/link";
import {
  Package,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Plus,
  Download,
  CalendarDays,
} from "lucide-react";

import AnimatedCounter from "@/components/animated-counter";
import DashboardOverview from "@/components/dashboard-overview";
import ProductSearch from "@/components/product-search";
import DashboardShell from "@/components/dashboard-shell";

import { getSessionUser } from "@/lib/product-access";
import {
  getCoverageStatus,
  getEffectiveCover,
} from "@/lib/coverage";
import { getMembership } from "@/lib/household";
import { getDaysRemaining } from "@/lib/warranty";
import { getDashboardCounts, listProductsForUser } from "@/lib/products-query";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const [{ items: products }, counts, membership] = await Promise.all([
    listProductsForUser(user.id, { limit: 50 }),
    getDashboardCounts(user.id),
    getMembership(user.id),
  ]);

  const expiringProducts = products.filter(
    (product) => getCoverageStatus(product) === "expiring"
  );

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Welcome header */}
        <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300/80">
            Your warranty. Our responsibility.
          </p>
          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-gray-400">
                Welcome back, {firstName}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {membership && membership.household.members.length > 1
                  ? membership.household.name
                  : "Your warranty vault"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-gray-500 md:text-base">
                {membership && membership.household.members.length > 1
                  ? `Shared with ${membership.household.members.length} people. Track products, documents, and expiry dates together.`
                  : "Track products, documents, and expiry dates in one calm place."}
              </p>
              {membership && membership.household.members.length > 1 && (
                <Link
                  href="/dashboard/settings"
                  className="mt-3 inline-block text-sm text-cyan-300/90 underline-offset-2 hover:underline"
                >
                  Manage household
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/add-product"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
              >
                <Plus size={16} />
                Add product
              </Link>
              <a
                href="#products"
                className="inline-flex items-center rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
              >
                View products
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Products</p>
              <Package size={16} className="text-gray-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              <AnimatedCounter value={counts.totalProducts} />
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Active</p>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-400">
              <AnimatedCounter value={counts.activeProducts} />
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Expiring soon</p>
              <Clock size={16} className="text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-400">
              <AnimatedCounter value={counts.expiringProducts} />
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Expired</p>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-red-400">
              <AnimatedCounter value={counts.expiredProducts} />
            </p>
          </div>
        </section>

        {/* Quick insights */}
        <DashboardOverview
          totalProducts={counts.totalProducts}
          activeProducts={counts.activeProducts}
          expiredProducts={counts.expiredProducts}
          expiringProducts={counts.expiringProducts}
        />

        {/* Alerts */}
        {expiringProducts.length > 0 && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Upcoming expiries
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Warranties that need attention soon
                </p>
              </div>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                {expiringProducts.length}
              </span>
            </div>

            <div className="space-y-2">
              {expiringProducts.map((product) => {
                const cover = getEffectiveCover(product);
                if (!cover) return null;
                const daysRemaining = getDaysRemaining(cover.date);

                return (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3.5 transition hover:border-amber-400/30 hover:bg-black/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[product.brand || "Unknown brand", cover.label]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-amber-300">
                      {daysRemaining}d left
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/10 bg-neutral-950/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
              <Package size={24} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              No products yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
              Add your first product with an invoice or warranty card to start
              tracking expiry dates and reminders.
            </p>
            <Link
              href="/dashboard/add-product"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              <Plus size={16} />
              Add first product
            </Link>
          </section>
        ) : (
          <section id="products" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Your products
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search and filter by warranty status
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/exports?format=csv"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  <Download size={14} />
                  CSV
                </a>
                <a
                  href="/api/exports?format=ics"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  <CalendarDays size={14} />
                  Calendar
                </a>
              </div>
            </div>
            <ProductSearch products={products} />
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
