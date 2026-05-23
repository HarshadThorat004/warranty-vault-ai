import { notFound } from "next/navigation";

import EditProductForm from "@/components/edit-product-form";

import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPage({
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

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-800 bg-neutral-900 p-10">
        <h1 className="mb-8 text-3xl font-bold">
          Edit Product
        </h1>

        <EditProductForm
          product={{
            ...product,

            purchaseDate:
              product.purchaseDate
                ?.toISOString()
                .split("T")[0] || "",

            warrantyExpiry:
              product.warrantyExpiry
                ?.toISOString()
                .split("T")[0] || "",
          }}
        
        />
      </div>
    </main>
  );
}