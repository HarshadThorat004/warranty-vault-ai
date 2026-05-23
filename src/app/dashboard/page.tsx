import { getServerSession } from "next-auth";

import Link from "next/link";

import ProductSearch from "@/components/product-search";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(
    authOptions
  );

  const user = await prisma.user.findUnique({
    where: {
      email: session?.user?.email || "",
    },

    include: {
      products: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        User not found
      </main>
    );
  }

  const today = new Date();

  const expiringProducts =
    user.products.filter((product) => {
      if (!product.warrantyExpiry)
        return false;

      const expiryDate = new Date(
        product.warrantyExpiry
      );

      const timeDifference =
        expiryDate.getTime() -
        today.getTime();

      const daysRemaining =
        Math.ceil(
          timeDifference /
            (1000 *
              60 *
              60 *
              24)
        );

      return daysRemaining <= 30;
    });

  const activeProducts =
    user.products.filter((product) => {
      if (!product.warrantyExpiry)
        return false;

      return (
        new Date(
          product.warrantyExpiry
        ) > today
      );
    });

  const expiredProducts =
    user.products.filter((product) => {
      if (!product.warrantyExpiry)
        return false;

      return (
        new Date(
          product.warrantyExpiry
        ) < today
      );
    });

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
      <div className="mb-10 overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-neutral-900 via-black to-neutral-950">
        <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
          
          <div>
            <div className="mb-4 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-300">
              AI Powered Warranty Protection
            </div>

            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Never Lose
              <span className="text-cyan-400">
                {" "}A Warranty{" "}
              </span>
              Again
            </h1>

            <p className="mt-5 max-w-xl text-lg text-gray-400">
              Store invoices, warranty cards,
              product details, and expiry dates
              securely in one intelligent vault.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dashboard/add-product"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
              >
                Add Product
              </Link>

              <button className="rounded-xl border border-gray-700 px-6 py-3 text-white transition hover:border-cyan-400 hover:text-cyan-300">
                AI Secure Storage
              </button>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
              alt="Warranty Vault AI"
              className="relative z-10 w-full max-w-md rounded-2xl border border-gray-800 object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-800 bg-neutral-900 p-6">
            <p className="text-sm text-gray-400">
              Total Products
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              {user.products.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
            <p className="text-sm text-green-300">
              Active Warranties
            </p>

            <h2 className="mt-3 text-4xl font-bold text-green-400">
              {activeProducts.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-sm text-red-300">
              Expired
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-400">
              {expiredProducts.length}
            </h2>
          </div>
        </div>

        {expiringProducts.length >
          0 && (
          <div className="mb-10 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-yellow-400">
                Warranty Alerts
              </h2>

              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300">
                {
                  expiringProducts.length
                }{" "}
                alert
                {expiringProducts.length >
                1
                  ? "s"
                  : ""}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {expiringProducts.map(
                (product) => {
                  if (
                    !product.warrantyExpiry
                  )
                    return null;

                  const expiryDate =
                    new Date(
                      product.warrantyExpiry
                    );

                  const timeDifference =
                    expiryDate.getTime() -
                    today.getTime();

                  const daysRemaining =
                    Math.ceil(
                      timeDifference /
                        (1000 *
                          60 *
                          60 *
                          24)
                    );

                  const isExpired =
                    daysRemaining < 0;

                  return (
                    <Link
                      key={
                        product.id
                      }
                      href={`/dashboard/products/${product.id}`}
                      className="block rounded-xl border border-yellow-500/20 bg-black/30 p-4 transition hover:border-yellow-400 hover:bg-black/50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {
                              product.name
                            }
                          </p>

                          <p className="text-sm text-gray-400">
                            {product.brand ||
                              "Unknown Brand"}
                          </p>
                        </div>

                        <div
                          className={`text-sm font-semibold ${
                            isExpired
                              ? "text-red-400"
                              : "text-yellow-300"
                          }`}
                        >
                          {isExpired
                            ? "Expired"
                            : `${daysRemaining} days left`}
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        )}

        {user.products.length ===
        0 ? (
          <div className="rounded-3xl border border-gray-800 bg-neutral-900 p-14 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl text-black">
              📦
            </div>

            <h2 className="mt-6 text-3xl font-bold">
              No Products Added Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-400">
              Start tracking your
              warranties,
              invoices, and
              expiry dates in one
              secure place.
            </p>

            <Link
              href="/dashboard/add-product"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
            >
              Add Your First
              Product
            </Link>
          </div>
        ) : (
        <ProductSearch
          products={user.products.map(
            (product) => ({
              ...product,
              brand:
                product.brand || "",
              serialNumber:
                product.serialNumber ||
                "",
              warrantyExpiry:
                product.warrantyExpiry ||
                new Date(),
              purchaseDate:
                product.purchaseDate ||
                new Date(),
              invoiceImage:
                product.invoiceImage ||
                "",
            })
          )}
        />
        )}
      </div>
    </main>
  );
}