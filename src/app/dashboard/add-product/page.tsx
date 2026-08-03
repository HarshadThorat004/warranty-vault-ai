import DashboardShell from "@/components/dashboard-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductForm from "@/components/product-form";

export default function AddProductPage() {
  return (
    <DashboardShell className="max-w-3xl">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Add product" },
          ]}
        />

        <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">
            New product
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Add product
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            Scan an invoice or warranty card to auto-fill, then complete any
            missing details.
          </p>

          <div className="mt-8">
            <ProductForm mode="create" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
