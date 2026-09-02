import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, FileDown, Pencil, X } from "lucide-react";

import AIInsightsCard from "@/components/ai-insights-card";
import DeleteProductButton from "@/components/delete-product-button";
import DashboardShell from "@/components/dashboard-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductDocuments from "@/components/product-documents";
import ProductHeroMedia from "@/components/product-hero-media";

import { assertProductOwner } from "@/lib/product-access";
import {
  getDaysRemaining,
  getProductThumbnail,
  productUsesPdfCover,
} from "@/lib/warranty";
import { categoryLabel, extendedCoverLabel } from "@/constants/catalog";
import { getServiceChecklist } from "@/constants/service-checklist";
import { getCoverageStatus, getEffectiveCover } from "@/lib/coverage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const access = await assertProductOwner(id);

  if (!access.product) {
    return notFound();
  }

  const product = access.product;

  const purchaseDate = product.purchaseDate
    ? new Date(product.purchaseDate)
    : null;
  const manufacturerExpiry = product.warrantyExpiry
    ? new Date(product.warrantyExpiry)
    : null;
  const extendedExpiry = product.extendedExpiry
    ? new Date(product.extendedExpiry)
    : null;
  const effectiveCover = getEffectiveCover(product);
  const expiryDate = effectiveCover?.date ?? manufacturerExpiry;
  const coverageStatus = getCoverageStatus(product);
  const checklist = getServiceChecklist(product.category);

  const totalWarrantyDays =
    purchaseDate && manufacturerExpiry
      ? Math.max(
          Math.ceil(
            (manufacturerExpiry.getTime() - purchaseDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          0
        )
      : 0;

  const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : 0;
  const safeDaysRemaining = Math.max(daysRemaining, 0);
  const expired = coverageStatus === "expired";
  const expiringSoon = coverageStatus === "expiring";
  const manufacturerDaysRemaining = manufacturerExpiry
    ? getDaysRemaining(manufacturerExpiry)
    : 0;

  const elapsedDays =
    totalWarrantyDays - Math.max(manufacturerDaysRemaining, 0);
  const progress =
    totalWarrantyDays > 0
      ? Math.min((elapsedDays / totalWarrantyDays) * 100, 100)
      : 0;

  const thumbnail = getProductThumbnail(product);
  const pdfCover = productUsesPdfCover(product);

  const statusLabel =
    coverageStatus === "expired"
      ? "Expired"
      : coverageStatus === "expiring"
        ? `${safeDaysRemaining} days left`
        : coverageStatus === "active"
          ? effectiveCover?.id === "extended"
            ? `${extendedCoverLabel(product.extendedType)} active`
            : "Active"
          : "No expiry set";

  const statusClass = expired
    ? "border-red-500/20 bg-red-500/10 text-red-300"
    : expiringSoon
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";

  return (
    <DashboardShell className="max-w-5xl">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: product.name },
          ]}
        />

        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80">
          <Link
            href="/dashboard"
            aria-label="Close and return to dashboard"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-gray-300 backdrop-blur-sm transition hover:bg-white/10 hover:text-white md:right-6 md:top-6"
          >
            <X size={18} />
          </Link>

          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[260px] bg-black/40">
              <ProductHeroMedia
                thumbnail={thumbnail}
                productName={product.name}
                pdfCover={pdfCover}
                documents={product.documents.map((doc) => ({
                  id: doc.id,
                  fileUrl: doc.fileUrl,
                  fileType: doc.fileType,
                  documentType: doc.documentType,
                }))}
              />
            </div>

            <div className="flex flex-col justify-center p-6 pt-14 md:p-8 md:pr-16 md:pt-8">
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
              >
                {statusLabel}
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {product.name}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {[
                  product.brand ?? "Unknown brand",
                  product.model,
                  product.retailer,
                  product.invoiceNumber ? `Invoice ${product.invoiceNumber}` : null,
                  product.serialNumber ? `SN ${product.serialNumber}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {product.renewalAvailable && (
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                  <p className="font-medium">Renewal available</p>
                  {product.renewalNotes && (
                    <p className="mt-1 text-cyan-100/70">{product.renewalNotes}</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100"
                >
                  <Pencil size={14} />
                  Edit
                </Link>
                <a
                  href={`/api/products/${product.id}/claim-pack`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:text-white"
                >
                  <FileDown size={14} />
                  Claim pack
                </a>
                {(manufacturerExpiry || extendedExpiry) && (
                  <a
                    href={`/api/exports?format=ics&productId=${product.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:text-white"
                  >
                    <CalendarDays size={14} />
                    Calendar
                  </a>
                )}
                <DeleteProductButton productId={product.id} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <p className="text-xs text-gray-500">Purchase date</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {purchaseDate
                ? purchaseDate.toLocaleDateString("en-US")
                : "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <p className="text-xs text-gray-500">Manufacturer warranty</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {manufacturerExpiry
                ? manufacturerExpiry.toLocaleDateString("en-US")
                : "Not set"}
            </p>
          </div>
          {extendedExpiry && (
            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
              <p className="text-xs text-gray-500">
                {extendedCoverLabel(product.extendedType)}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {extendedExpiry.toLocaleDateString("en-US")}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <p className="text-xs text-gray-500">Added on</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {new Date(product.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
          {product.purchaseAmount && (
            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
              <p className="text-xs text-gray-500">Purchase amount</p>
              <p className="mt-2 text-lg font-semibold text-white">
                ₹{product.purchaseAmount}
              </p>
            </div>
          )}
          {product.category && (
            <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
              <p className="text-xs text-gray-500">Category</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {categoryLabel(product.category)}
              </p>
            </div>
          )}
        </section>

        {product.notes && (
          <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-white">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-400">
              {product.notes}
            </p>
          </section>
        )}

        {manufacturerDaysRemaining >= 0 && totalWarrantyDays > 0 && (
          <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Manufacturer coverage
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  How much of the brand warranty period has passed
                </p>
              </div>
              <span className="text-sm font-medium text-gray-300">
                {Math.floor(progress)}%
              </span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${
                  expiringSoon ? "bg-amber-400" : "bg-cyan-400"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs text-gray-500">Days left</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {Math.max(manufacturerDaysRemaining, 0)}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs text-gray-500">Total days</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {totalWarrantyDays}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Documents</h2>
              <p className="mt-1 text-xs text-gray-500">
                Invoices, warranty cards, and related files
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-400">
              {product.documents.length}
            </span>
          </div>

          <ProductDocuments
            documents={product.documents.map((doc) => ({
              id: doc.id,
              fileUrl: doc.fileUrl,
              fileType: doc.fileType,
              documentType: doc.documentType,
            }))}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              {checklist.title}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Print the claim pack and tick these at the desk. Do not leave
              originals behind.
            </p>
          </div>
          <ul className="space-y-2.5">
            {checklist.items.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-6 text-gray-300"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href={`/api/products/${product.id}/claim-pack`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300/90 hover:text-cyan-200"
          >
            <FileDown size={14} />
            Download claim pack
          </a>
        </section>

        <AIInsightsCard
          daysRemaining={safeDaysRemaining}
          isExpired={expired}
          coverLabel={effectiveCover?.label}
          nextAction={
            expired
              ? "Keep the claim pack for service history."
              : checklist.items[0]
          }
        />
      </div>
    </DashboardShell>
  );
}
