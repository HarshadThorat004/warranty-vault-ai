"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import { toast } from "sonner";

import UploadButtonComponent from "@/components/upload-button";

type DocumentType = {
  id?: string;
  fileUrl: string;
  fileType: string;
  documentType: string;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  purchaseDate: string;
  warrantyExpiry: string;
  invoiceImage: string | null;

  documents?: DocumentType[];
};

type Props = {
  product: Product;
};

export default function EditProductForm({
  product,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [documents, setDocuments] =
    useState<DocumentType[]>(
      product.documents || []
    );

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

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
      `/api/products/${product.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(body),
      }
    );

    setLoading(false);

    if (response.ok) {
      toast.success(
        "Product updated successfully"
      );

      router.push(
        `/dashboard/products/${product.id}`
      );

      router.refresh();
    } else {
      toast.error(
        "Something went wrong"
      );
    }
  }

  function removeDocument(
    index: number
  ) {
    setDocuments((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    toast.success(
      "Document removed"
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="mb-2 block text-sm text-gray-400">
          Product Name
        </label>

        <input
          type="text"
          name="name"
          required
          defaultValue={product.name}
          className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-400">
          Brand
        </label>

        <input
          type="text"
          name="brand"
          defaultValue={
            product.brand || ""
          }
          className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-400">
          Purchase Date
        </label>

        <input
          type="date"
          name="purchaseDate"
          required
          defaultValue={
            product.purchaseDate
          }
          className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-gray-400">
          Warranty Expiry
        </label>

        <input
          type="date"
          name="warrantyExpiry"
          required
          defaultValue={
            product.warrantyExpiry
          }
          className="w-full rounded-xl border border-gray-700 bg-black p-3 outline-none transition focus:border-white"
        />
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm text-gray-400">
            Upload Invoice
          </p>

          <UploadButtonComponent
            onChange={(url) => {
              if (url) {
                setDocuments((prev) => [
                  ...prev,
                  {
                    fileUrl: url,
                    fileType: "image",
                    documentType:
                      "Invoice",
                  },
                ]);

                toast.success(
                  "Invoice uploaded"
                );
              }
            }}
          />
        </div>

        <div>
          <p className="mb-3 text-sm text-gray-400">
            Upload Warranty Card
          </p>

          <UploadButtonComponent
            onChange={(url) => {
              if (url) {
                setDocuments((prev) => [
                  ...prev,
                  {
                    fileUrl: url,
                    fileType: "image",
                    documentType:
                      "Warranty Card",
                  },
                ]);

                toast.success(
                  "Warranty card uploaded"
                );
              }
            }}
          />
        </div>

        <div>
          <p className="mb-3 text-sm text-gray-400">
            Upload Other Documents
          </p>

          <UploadButtonComponent
            onChange={(url) => {
              if (url) {
                setDocuments((prev) => [
                  ...prev,
                  {
                    fileUrl: url,
                    fileType: "image",
                    documentType:
                      "Other",
                  },
                ]);

                toast.success(
                  "Document uploaded"
                );
              }
            }}
          />
        </div>
      </div>

      {documents.length > 0 && (
        <div className="grid gap-5">
          {documents.map(
            (doc, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-700 bg-black"
              >
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                  <p className="text-sm text-gray-300">
                    {
                      doc.documentType
                    }
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeDocument(
                        index
                      )
                    }
                    className="text-sm text-red-400 transition hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <Image
                  src={doc.fileUrl}
                  alt={
                    doc.documentType
                  }
                  width={800}
                  height={500}
                  className="h-auto w-full object-cover"
                />
              </div>
            )
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Save Changes"}
      </button>
    </form>
  );
}