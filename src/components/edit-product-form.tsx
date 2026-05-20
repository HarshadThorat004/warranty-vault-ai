"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import UploadButtonComponent from "@/components/upload-button";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  purchaseDate: string;
  warrantyExpiry: string;
  invoiceImage: string | null;
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

  const [imageUrl, setImageUrl] =
    useState(
      product.invoiceImage || ""
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

      invoiceImage: imageUrl,
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
      router.push(
        `/dashboard/products/${product.id}`
      );

      router.refresh();
    } else {
      alert("Something went wrong");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
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
          className="w-full rounded-lg border border-gray-700 bg-black p-3 outline-none"
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
          className="w-full rounded-lg border border-gray-700 bg-black p-3 outline-none"
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
          className="w-full rounded-lg border border-gray-700 bg-black p-3 outline-none"
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
          className="w-full rounded-lg border border-gray-700 bg-black p-3 outline-none"
        />
      </div>

      <div>
        <label className="mb-3 block text-sm text-gray-400">
          Upload Invoice
        </label>

        <UploadButtonComponent
          onChange={(url) => {
            if (url) {
              setImageUrl(url);
            }
          }}
        />
      </div>

      {imageUrl && (
        <div>
          <Image
            src={imageUrl}
            alt="Invoice"
            width={800}
            height={500}
            className="rounded-xl border border-gray-700"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-white py-3 font-semibold text-black"
      >
        {loading
          ? "Saving..."
          : "Save Changes"}
      </button>
    </form>
  );
}