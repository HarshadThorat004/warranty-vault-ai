"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

type Props = {
  productId: string;
};

export default function DeleteProductButton({
  productId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [confirm, setConfirm] =
    useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete"
        );
      }

      toast.success(
        "Product deleted successfully"
      );

      router.push("/dashboard");

      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to delete product"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() =>
          setConfirm(true)
        }
        className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
      >
        Delete Product
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading
          ? "Deleting..."
          : "Confirm Delete"}
      </button>

      <button
        type="button"
        onClick={() =>
          setConfirm(false)
        }
        className="rounded-xl border border-gray-700 px-6 py-3 font-semibold text-white transition hover:bg-neutral-800"
      >
        Cancel
      </button>
    </div>
  );
}