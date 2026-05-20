import { getServerSession } from "next-auth";

import Link from "next/link";

import ProductSearch from "@/components/product-search";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

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

  const expiringProducts =
    user.products.filter((product) => {
      const today = new Date();

      const expiryDate = new Date(
        product.warrantyExpiry
      );

      const timeDifference =
        expiryDate.getTime() -
        today.getTime();

      const daysRemaining = Math.ceil(
        timeDifference /
          (1000 * 60 * 60 * 24)
      );

      return daysRemaining <= 30;
    });

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              Welcome back, {user.name}
            </p>
          </div>

          <Link
            href="/dashboard/add-product"
            className="rounded-lg bg-white px-5 py-3 text-black"
          >
            Add Product
          </Link>
        </div>

        {expiringProducts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-2xl font-bold text-yellow-400">
              Warranty Alerts
            </h2>

            <div className="mt-4 space-y-3">
              {expiringProducts.map(
                (product) => {
                  const today =
                    new Date();

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
                      key={product.id}
                      href={`/dashboard/products/${product.id}`}
                      className="block rounded-xl border border-yellow-500/20 bg-black/30 p-4 transition hover:border-yellow-400"
                    >
                      <div className="flex items-center justify-between">
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

        {user.products.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 p-10 text-center">
            <h2 className="text-2xl font-semibold">
              No products yet
            </h2>

            <p className="mt-2 text-gray-400">
              Add your first product warranty.
            </p>
          </div>
        ) : (
          <ProductSearch
            products={user.products}
          />
        )}
      </div>
    </main>
  );
}