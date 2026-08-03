import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, Package, Pencil } from "lucide-react";

import AIInsightsCard from "@/components/ai-insights-card";
import DeleteProductButton from "@/components/delete-product-button";
import DashboardShell from "@/components/dashboard-shell";
import Breadcrumbs from "@/components/breadcrumbs";

import { assertProductOwner } from "@/lib/product-access";
import {
  getDaysRemaining,
  getProductThumbnail,
  isExpired,
} from "@/lib/warranty";
import { EXPIRING_SOON_DAYS } from "@/constants/warranty";

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
  const expiryDate = product.warrantyExpiry
    ? new Date(product.warrantyExpiry)
    : null;

  const totalWarrantyDays =
    purchaseDate && expiryDate
      ? Math.max(
          Math.ceil(
            (expiryDate.getTime() - purchaseDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          0
        )
      : 0;

  const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : 0;
  const safeDaysRemaining = Math.max(daysRemaining, 0);
  const expired = expiryDate ? isExpired(expiryDate) : false;
  const expiringSoon =
    !!expiryDate && !expired && daysRemaining <= EXPIRING_SOON_DAYS;

  const elapsedDays = totalWarrantyDays - safeDaysRemaining;
  const progress =
    totalWarrantyDays > 0
      ? Math.min((elapsedDays / totalWarrantyDays) * 100, 100)
      : 0;

  const thumbnail = getProductThumbnail(product);

  const statusLabel = expired
    ? "Expired"
    : expiringSoon
      ? `${safeDaysRemaining} days left`
      : expiryDate
        ? "Active"
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

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[260px] bg-black/40">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={product.name}
                  width={1200}
                  height={900}
                  priority
                  className="h-full min-h-[260px] w-full object-cover"
                />
              ) : (
                <div className="flex min-h-[260px] items-center justify-center text-gray-600">
                  <Package size={40} />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-6 md:p-8">
              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
              >
                {statusLabel}
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {product.name}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {product.brand ?? "Unknown brand"}
                {product.serialNumber ? ` · ${product.serialNumber}` : ""}
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
            <p className="text-xs text-gray-500">Warranty expiry</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {expiryDate ? expiryDate.toLocaleDateString("en-US") : "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5">
            <p className="text-xs text-gray-500">Added on</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {new Date(product.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </section>

        {product.notes && (
          <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-white">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-400">
              {product.notes}
            </p>
          </section>
        )}

        {!expired && totalWarrantyDays > 0 && (
          <section className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Warranty usage
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  How much of the coverage period has passed
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
                  {safeDaysRemaining}
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

          {product.documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
              <FileText className="mx-auto text-gray-600" size={28} />
              <p className="mt-3 text-sm font-medium text-gray-300">
                No documents yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Add files from the edit page.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {product.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {doc.documentType}
                    </p>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-cyan-300 hover:underline"
                    >
                      Open
                    </a>
                  </div>
                  <Image
                    src={doc.fileUrl}
                    alt={doc.documentType}
                    width={1200}
                    height={900}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <AIInsightsCard
          daysRemaining={safeDaysRemaining}
          isExpired={expired}
        />
      </div>
    </DashboardShell>
  );
}
