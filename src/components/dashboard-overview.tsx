import Link from "next/link";
import {
  Plus,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

type Props = {
  totalProducts: number;
  activeProducts: number;
  expiredProducts: number;
  expiringProducts: number;
};

export default function DashboardOverview({
  totalProducts,
  activeProducts,
  expiredProducts,
  expiringProducts,
}: Props) {
  const healthPercent =
    totalProducts > 0
      ? Math.round((activeProducts / totalProducts) * 100)
      : 0;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Link
        href="/dashboard/add-product"
        className="group rounded-2xl border border-white/10 bg-neutral-950/80 p-6 transition hover:border-cyan-400/40 hover:bg-neutral-900"
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-black">
          <Plus size={22} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-semibold text-white">Add product</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Scan an invoice or enter warranty details manually.
        </p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-cyan-300 transition group-hover:gap-2">
          Open
          <ArrowUpRight size={16} />
        </span>
      </Link>

      <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck size={22} />
        </div>
        <h3 className="text-lg font-semibold text-white">Warranty health</h3>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-emerald-400">
            {healthPercent}%
          </span>
          <span className="text-sm text-gray-500">
            {activeProducts} of {totalProducts} active
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-lg font-semibold text-white">Needs attention</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-amber-400">
              {expiringProducts}
            </p>
            <p className="mt-1 text-xs text-gray-500">Expiring soon</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-red-400">
              {expiredProducts}
            </p>
            <p className="mt-1 text-xs text-gray-500">Expired</p>
          </div>
        </div>
      </div>
    </section>
  );
}
