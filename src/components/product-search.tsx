"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import Image from "next/image";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  purchaseDate: Date;
  warrantyExpiry: Date;
  createdAt: Date;
  invoiceImage: string | null;
  userId: string;
};

type Props = {
  products: Product[];
};

type FilterType =
  | "all"
  | "active"
  | "expiring"
  | "expired";

export default function ProductSearch({
  products,
}: Props) {
  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  const filteredProducts =
    useMemo(() => {
      return products.filter(
        (product) => {
          const searchText =
            search.toLowerCase();

          const matchesSearch =
            product.name
              .toLowerCase()
              .includes(searchText) ||
            product.brand
              ?.toLowerCase()
              .includes(searchText);

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

          const isExpiringSoon =
            daysRemaining <=
              30 &&
            daysRemaining >= 0;

          if (filter === "active") {
            return (
              matchesSearch &&
              !isExpired
            );
          }

          if (
            filter === "expiring"
          ) {
            return (
              matchesSearch &&
              isExpiringSoon
            );
          }

          if (filter === "expired") {
            return (
              matchesSearch &&
              isExpired
            );
          }

          return matchesSearch;
        }
      );
    }, [products, search, filter]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full rounded-xl border border-gray-700 bg-neutral-900 p-4 text-white outline-none transition focus:border-white md:max-w-md"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              setFilter("all")
            }
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter === "all"
                ? "bg-white text-black"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            All
          </button>

          <button
            onClick={() =>
              setFilter("active")
            }
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter === "active"
                ? "bg-green-400 text-black"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Active
          </button>

          <button
            onClick={() =>
              setFilter(
                "expiring"
              )
            }
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter ===
              "expiring"
                ? "bg-yellow-400 text-black"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Expiring
          </button>

          <button
            onClick={() =>
              setFilter(
                "expired"
              )
            }
            className={`rounded-lg px-4 py-2 text-sm transition ${
              filter ===
              "expired"
                ? "bg-red-400 text-black"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {filteredProducts.length ===
      0 ? (
        <div className="rounded-2xl border border-gray-800 p-10 text-center">
          <h2 className="text-2xl font-semibold">
            No matching products
          </h2>

          <p className="mt-2 text-gray-400">
            Try another search or
            filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(
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

              const isExpiringSoon =
                daysRemaining <=
                  30 &&
                daysRemaining >= 0;

              return (
                <Link
                  href={`/dashboard/products/${product.id}`}
                  key={
                    product.id
                  }
                  className="rounded-2xl border border-gray-800 bg-neutral-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-white hover:shadow-2xl"
                >
                  {product.invoiceImage && (
                    <div className="mb-4 overflow-hidden rounded-xl border border-gray-800">
                      <Image
                        src={
                          product.invoiceImage
                        }
                        alt="Invoice"
                        width={500}
                        height={300}
                        priority
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  <h2 className="text-2xl font-bold">
                    {
                      product.name
                    }
                  </h2>

                  <p className="mt-2 text-gray-400">
                    {product.brand ||
                      "Unknown Brand"}
                  </p>

                  <div
                    className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      isExpired
                        ? "bg-red-500/20 text-red-400"
                        : isExpiringSoon
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {isExpired
                      ? "Expired"
                      : isExpiringSoon
                      ? `Expires in ${daysRemaining} days`
                      : "Active Warranty"}
                  </div>

                  <div className="mt-6 space-y-2 text-sm">
                    <p>
                      Purchase Date:{" "}
                      {new Date(
                        product.purchaseDate
                      ).toLocaleDateString(
                        "en-US"
                      )}
                    </p>

                    <p>
                      Warranty
                      Expiry:{" "}
                      {new Date(
                        product.warrantyExpiry
                      ).toLocaleDateString(
                        "en-US"
                      )}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}