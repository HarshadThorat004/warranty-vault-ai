import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, X } from "lucide-react";

import DashboardShell from "@/components/dashboard-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductForm from "@/components/product-form";

import { assertProductOwner } from "@/lib/product-access";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const access = await assertProductOwner(id);

  if (!access.product) {
    return notFound();
  }

  const product = access.product;

  return (
    <DashboardShell className="max-w-3xl">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            {
              label: product.name,
              href: `/dashboard/products/${product.id}`,
            },
            { label: "Edit" },
          ]}
        />

        <div className="relative rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
          <Link
            href={`/dashboard/products/${product.id}`}
            aria-label="Cancel and return to product"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/5 hover:text-white md:right-6 md:top-6"
          >
            <X size={18} />
          </Link>

          <p className="pr-12 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">
            Edit product
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Update details
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            Adjust warranty info, documents, notes, and renewal options.
          </p>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-gray-400">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{product.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {product.brand || "Unknown brand"}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <ProductForm
              mode="edit"
              productId={product.id}
              defaultValues={{
                name: product.name,
                brand: product.brand || "",
                serialNumber: product.serialNumber || "",
                invoiceNumber: product.invoiceNumber || "",
                purchaseDate:
                  product.purchaseDate?.toISOString().split("T")[0] || "",
                warrantyExpiry:
                  product.warrantyExpiry?.toISOString().split("T")[0] || "",
                notes: product.notes || "",
                renewalAvailable: product.renewalAvailable,
                renewalNotes: product.renewalNotes || "",
                documents: product.documents.map((doc) => ({
                  id: doc.id,
                  fileUrl: doc.fileUrl,
                  fileType: doc.fileType,
                  documentType: doc.documentType as
                    | "Invoice"
                    | "Warranty Card"
                    | "Other",
                })),
              }}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
