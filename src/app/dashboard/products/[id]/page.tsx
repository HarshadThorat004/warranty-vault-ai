import {
    notFound,
    redirect,
  } from "next/navigation";
  
  import Link from "next/link";
  
  import Image from "next/image";
  
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
  
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });
  
    if (!product) {
      return notFound();
    }
  
    const today = new Date();
  
    const expiryDate = new Date(
      product.warrantyExpiry
    );
  
    const timeDifference =
      expiryDate.getTime() - today.getTime();
  
    const daysRemaining = Math.ceil(
      timeDifference /
        (1000 * 60 * 60 * 24)
    );
  
    const isExpired = daysRemaining < 0;
  
    const isExpiringSoon =
      daysRemaining <= 30 &&
      daysRemaining >= 0;
  
    async function deleteProduct() {
      "use server";
  
      await prisma.product.delete({
        where: {
          id,
        },
      });
  
      redirect("/dashboard");
    }
  
    return (
      <main className="min-h-screen bg-black p-4 text-white md:p-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-neutral-900 p-6 md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">
                {product.name}
              </h1>
  
              <p className="mt-2 text-gray-400">
                {product.brand ||
                  "Unknown Brand"}
              </p>
            </div>
  
            <Link
              href="/dashboard"
              className="w-fit rounded-lg border border-gray-700 px-4 py-2 text-sm transition hover:bg-white hover:text-black"
            >
              Back
            </Link>
          </div>
  
          <div
            className={`mt-6 inline-block rounded-full px-4 py-2 text-sm font-semibold ${
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
              ? `Expires in ${daysRemaining} days`
              : `${daysRemaining} days remaining`}
          </div>
  
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/dashboard/products/${product.id}/edit`}
              className="rounded-lg bg-white px-5 py-3 text-center text-black transition hover:bg-gray-200"
            >
              Edit Product
            </Link>
  
            <form action={deleteProduct}>
              <button
                className="w-full rounded-lg bg-red-500 px-5 py-3 text-white transition hover:bg-red-600"
              >
                Delete Product
              </button>
            </form>
          </div>
  
          {product.invoiceImage && (
            <div className="mt-10">
              <h2 className="mb-4 text-sm text-gray-400">
                Invoice Image
              </h2>
  
              <div className="overflow-hidden rounded-2xl border border-gray-800">
                <Image
                  src={product.invoiceImage}
                  alt="Invoice"
                  width={1200}
                  height={800}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          )}
  
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-black/40 p-5">
              <h2 className="text-sm text-gray-400">
                Purchase Date
              </h2>
  
              <p className="mt-2 text-lg font-medium">
                {new Date(
                  product.purchaseDate
                ).toLocaleDateString("en-US")}
              </p>
            </div>
  
            <div className="rounded-xl border border-gray-800 bg-black/40 p-5">
              <h2 className="text-sm text-gray-400">
                Warranty Expiry
              </h2>
  
              <p className="mt-2 text-lg font-medium">
                {new Date(
                  product.warrantyExpiry
                ).toLocaleDateString("en-US")}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }