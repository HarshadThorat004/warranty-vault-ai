"use client";

import { useState } from "react";

import Image from "next/image";

import { useRouter } from "next/navigation";

import UploadButtonComponent from "@/components/upload-button";

export default function AddProductPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [imageUrl, setImageUrl] =
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

        invoiceImage: imageUrl,
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
        router.push("/dashboard");

        router.refresh();
      } else {
        alert("Something went wrong");
      }
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-800 bg-neutral-900 p-10">
        <h1 className="mb-8 text-3xl font-bold">
          Add Product
        </h1>

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

            {imageUrl && (
              <div className="mt-5">
                <Image
                  src={imageUrl}
                  alt="Invoice"
                  width={500}
                  height={300}
                  className="rounded-xl border border-gray-700 object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-3 font-semibold text-black transition hover:bg-gray-200 disabled:opacity-50"
          >
            {loading
              ? "Adding..."
              : "Add Product"}
          </button>
        </form>
      </div>
    </main>
  );
}