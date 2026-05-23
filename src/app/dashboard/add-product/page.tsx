"use client";

import { useState } from "react";

import Link from "next/link";

import Image from "next/image";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

import UploadButtonComponent from "@/components/upload-button";

type DocumentType = {
  fileUrl: string;
  fileType: string;
  documentType: string;
};

export default function AddProductPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [documents, setDocuments] =
    useState<DocumentType[]>([]);

  const [productName, setProductName] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [purchaseDate, setPurchaseDate] =
    useState("");

  const [warrantyExpiry, setWarrantyExpiry] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData(
        e.currentTarget
      );

      const body = {
        name: formData.get("name"),
        brand: formData.get("brand"),
        purchaseDate:
          formData.get("purchaseDate"),
        warrantyExpiry:
          formData.get("warrantyExpiry"),
        documents,
      };

      const response = await fetch(
        "/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success(
          "Product added successfully"
        );

        router.push("/dashboard");

        router.refresh();
      } else {
        toast.error(
          "Failed to add product"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function addDocument(
    url: string,
    documentType: string
  ) {
    setDocuments((prev) => [
      ...prev,
      {
        fileUrl: url,
        fileType: "image",
        documentType,
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-800 bg-neutral-900 p-6 md:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold md:text-4xl">
              Add Product
            </h1>

            <p className="mt-2 text-gray-400">
              Store your warranty
              details securely.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* PRODUCT NAME */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                required
                value={productName}
                onChange={(e) =>
                  setProductName(
                    e.target.value
                  )
                }
                placeholder="iPhone 15 Pro"
                className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
              />
            </div>

            {/* BRAND */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Brand
              </label>

              <input
                type="text"
                name="brand"
                value={brand}
                onChange={(e) =>
                  setBrand(e.target.value)
                }
                placeholder="Apple"
                className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
              />
            </div>

            {/* PURCHASE DATE */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Purchase Date
              </label>

              <input
                type="date"
                name="purchaseDate"
                required
                value={purchaseDate}
                onChange={(e) =>
                  setPurchaseDate(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
              />
            </div>

            {/* WARRANTY EXPIRY */}
            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Warranty Expiry
              </label>

              <input
                type="date"
                name="warrantyExpiry"
                required
                value={warrantyExpiry}
                onChange={(e) =>
                  setWarrantyExpiry(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
              />
            </div>

            {/* DOCUMENT UPLOADS */}
            <div>
              <label className="mb-3 block text-sm text-gray-400">
                Upload Documents
              </label>

              <p className="mb-4 text-sm text-gray-500">
                AI invoice scanning
                coming soon.
              </p>

              <div className="space-y-4">
                {/* INVOICE */}
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    Invoice
                  </p>

                  <UploadButtonComponent
                    onChange={async (url) => {
                      if (!url) return;

                      addDocument(
                        url,
                        "Invoice"
                      );

                      toast.success(
                        "Invoice uploaded"
                      );
                    }}
                  />
                </div>

                {/* WARRANTY CARD */}
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    Warranty Card
                  </p>

                  <UploadButtonComponent
                    onChange={async (url) => {
                      if (!url) return;

                      addDocument(
                        url,
                        "Warranty Card"
                      );

                      toast.success(
                        "Warranty card uploaded"
                      );
                    }}
                  />
                </div>

                {/* OTHER DOCUMENT */}
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    Other Document
                  </p>

                  <UploadButtonComponent
                    onChange={async (url) => {
                      if (!url) return;

                      addDocument(
                        url,
                        "Other"
                      );

                      toast.success(
                        "Document uploaded"
                      );
                    }}
                  />
                </div>
              </div>

              {/* DOCUMENT PREVIEW */}
              {documents.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
                  No documents uploaded yet.
                </div>
              )}
              {documents.length > 0 && (
                <div className="mt-6 grid gap-4">
                  {documents.map(
                    (doc, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-2xl border border-gray-700"
                      >
                        <div className="flex items-center justify-between border-b border-gray-800 bg-neutral-950 px-4 py-2">
                          <p className="text-sm text-gray-400">
                            {doc.documentType}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setDocuments((prev) =>
                                prev.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            className="text-sm text-red-400 transition hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>

                        <Image
                          src={doc.fileUrl}
                          alt={doc.documentType}
                          width={1200}
                          height={800}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Adding Product..."
                : "Add Product"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}