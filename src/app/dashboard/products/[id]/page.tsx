import { notFound } from "next/navigation";

import Link from "next/link";
import Image from "next/image";

import DeleteProductButton from "@/components/delete-product-button";

import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({
  params,
}: Props) {
  const { id } = await params;

  const product =
    await prisma.product.findUnique({
      where: {
        id,
      },

      include: {
        documents: true,
      },
    });

  if (!product) {
    return notFound();
  }

  const today = new Date();

  const purchaseDate =
    product.purchaseDate
      ? new Date(product.purchaseDate)
      : null;

  const expiryDate =
    product.warrantyExpiry
      ? new Date(product.warrantyExpiry)
      : null;

  const totalWarrantyDays =
    purchaseDate && expiryDate
      ? Math.ceil(
          (expiryDate.getTime() -
            purchaseDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const daysRemaining =
    expiryDate
      ? Math.ceil(
          (expiryDate.getTime() -
            today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const safeDaysRemaining =
    Math.max(daysRemaining, 0);

  const isExpired =
    expiryDate
      ? daysRemaining < 0
      : false;

      const isExpiringSoon =
      !!expiryDate &&
      !isExpired &&
      daysRemaining <= 30;

  const elapsedDays =
    totalWarrantyDays -
    safeDaysRemaining;

  const progress =
    totalWarrantyDays > 0
      ? Math.min(
          (elapsedDays /
            totalWarrantyDays) *
            100,
          100
        )
      : 0;

  

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-800 bg-neutral-900 p-6 shadow-2xl md:p-10">
        {/* HEADER */}
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div
              className={`mb-4 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                isExpired
                  ? "bg-red-500/20 text-red-400"
                  : isExpiringSoon
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {isExpired
                ? "Warranty Expired"
                : isExpiringSoon
                ? `Expires in ${safeDaysRemaining} days`
                : `${safeDaysRemaining} days remaining`}
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-3 text-lg text-gray-400">
              {product.brand ??
                "Unknown Brand"}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-xl border border-gray-700 px-5 py-3 text-sm font-medium transition hover:bg-white hover:text-black"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-black transition hover:bg-gray-200"
          >
            Edit Product
          </Link>

          
            <DeleteProductButton 
              productId={product.id}
            />
          
        </div>

        {/* WARRANTY PROGRESS */}
        {!isExpired &&
          totalWarrantyDays > 0 && (
            <div className="mt-10 rounded-2xl border border-gray-800 bg-black/30 p-6">
              <div className="mb-3 flex items-center justify-between text-sm text-gray-400">
                <span>
                  Warranty Usage
                </span>

                <span>
                  {Math.floor(
                    progress
                  )}
                  %
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-800">
                <div
                  className={`h-full transition-all ${
                    isExpiringSoon
                      ? "bg-yellow-400"
                      : "bg-white"
                  }`}
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

        {/* DOCUMENTS */}
        <div className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">
            Product Documents
          </h2>

          {product.documents.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 p-10 text-center text-gray-500">
              <div className="text-5xl">
                📂
              </div>

              <p className="mt-4">
                No documents uploaded yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {product.documents.map(
                (doc) => (
                  <div
                    key={doc.id}
                    className="overflow-hidden rounded-3xl border border-gray-800 bg-black"
                  >
                    <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                      <h3 className="font-semibold">
                        {
                          doc.documentType
                        }
                      </h3>

                      <a
                        href={
                          doc.fileUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 transition hover:text-white"
                      >
                        Open
                      </a>
                    </div>

                    {doc.fileType ===
                    "pdf" ? (
                      <div className="flex h-72 flex-col items-center justify-center bg-neutral-950 text-center">
                        <div className="text-6xl">
                          📄
                        </div>

                        <p className="mt-4 text-lg font-semibold">
                          PDF Document
                        </p>

                        <a
                          href={
                            doc.fileUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 rounded-xl bg-white px-5 py-2 text-black transition hover:bg-gray-200"
                        >
                          Open PDF
                        </a>
                      </div>
                    ) : (
                      <Image
                        src={doc.fileUrl}
                        alt={
                          doc.documentType
                        }
                        width={800}
                        height={600}
                        className="h-72 w-full object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* PRODUCT INFO */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-black/40 p-6">
            <p className="text-sm text-gray-400">
              Purchase Date
            </p>

            <h3 className="mt-3 text-2xl font-bold">
              {purchaseDate
                ? purchaseDate.toLocaleDateString(
                    "en-US"
                  )
                : "N/A"}
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black/40 p-6">
            <p className="text-sm text-gray-400">
              Warranty Expiry
            </p>

            <h3 className="mt-3 text-2xl font-bold">
              {expiryDate
                ? expiryDate.toLocaleDateString(
                    "en-US"
                  )
                : "N/A"}
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black/40 p-6">
            <p className="text-sm text-gray-400">
              Added On
            </p>

            <h3 className="mt-3 text-2xl font-bold">
              {new Date(
                product.createdAt
              ).toLocaleDateString(
                "en-US"
              )}
            </h3>
          </div>
        </div>

        {/* WARRANTY STATUS */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-black/30 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          🛡️ Warranty Status
        </h2>

          <p className="mt-3 text-gray-300">
            {isExpired
              ? "This product warranty has expired."
              : isExpiringSoon
              ? `This warranty will expire in ${safeDaysRemaining} days.`
              : `Your warranty is active with ${safeDaysRemaining} days remaining.`}
          </p>
        </div>
      </div>
    </main>
  );
}