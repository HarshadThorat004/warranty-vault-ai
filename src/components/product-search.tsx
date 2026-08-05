"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Search, ArrowUpRight } from "lucide-react";

import type { Product } from "@/types/product";
import {
  getDaysRemaining,
  getProductThumbnail,
  isExpired,
  isExpiringSoon,
  productUsesPdfCover,
} from "@/lib/warranty";
import PdfPlaceholder from "@/components/pdf-placeholder";

type Props = {
  products: Product[];
};

type FilterType = "all" | "active" | "expiring" | "expired";

export default function ProductSearch({ products }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(searchText) ||
        (product.brand ?? "").toLowerCase().includes(searchText);

      if (!product.warrantyExpiry) {
        return filter === "all" ? matchesSearch : false;
      }

      const expired = isExpired(product.warrantyExpiry);
      const expiring = isExpiringSoon(product.warrantyExpiry);

      if (filter === "active") return matchesSearch && !expired;
      if (filter === "expiring") return matchesSearch && expiring;
      if (filter === "expired") return matchesSearch && expired;
      return matchesSearch;
    });

    return list.sort((a, b) => {
      if (!a.warrantyExpiry) return 1;
      if (!b.warrantyExpiry) return -1;
      return (
        getDaysRemaining(a.warrantyExpiry) - getDaysRemaining(b.warrantyExpiry)
      );
    });
  }, [products, search, filter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by name or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-400/60"
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter products"
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "expiring", label: "Expiring" },
              { key: "expired", label: "Expired" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                filter === item.key
                  ? "border-white bg-white text-black"
                  : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <Search className="mx-auto text-gray-600" size={24} />
          <p className="mt-3 text-sm font-medium text-gray-300">
            No matching products
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Try another search or filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const thumbnail = getProductThumbnail(product);
            const pdfCover = productUsesPdfCover(product);
            const daysRemaining = product.warrantyExpiry
              ? getDaysRemaining(product.warrantyExpiry)
              : null;
            const expired = product.warrantyExpiry
              ? isExpired(product.warrantyExpiry)
              : false;
            const expiring = product.warrantyExpiry
              ? isExpiringSoon(product.warrantyExpiry)
              : false;

            return (
              <Link
                key={product.id}
                href={`/dashboard/products/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 transition hover:border-white/20"
              >
                <div className="relative border-b border-white/5">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      width={500}
                      height={280}
                      className="h-40 w-full object-cover"
                      unoptimized
                    />
                  ) : pdfCover ? (
                    <PdfPlaceholder sizeClassName="h-40" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-black/40 text-gray-600">
                      <Package size={32} />
                    </div>
                  )}

                  {daysRemaining !== null && (
                    <span
                      className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${
                        expired
                          ? "border-red-500/30 bg-red-500/20 text-red-200"
                          : expiring
                            ? "border-amber-500/30 bg-amber-500/20 text-amber-200"
                            : "border-emerald-500/30 bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {expired
                        ? "Expired"
                        : expiring
                          ? `${daysRemaining}d left`
                          : "Active"}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.brand || "Unknown brand"}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-gray-600 transition group-hover:text-cyan-300"
                    />
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Purchase</span>
                      <span className="text-gray-300">
                        {product.purchaseDate
                          ? new Date(product.purchaseDate).toLocaleDateString(
                              "en-US"
                            )
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Expiry</span>
                      <span className="text-gray-300">
                        {product.warrantyExpiry
                          ? new Date(
                              product.warrantyExpiry
                            ).toLocaleDateString("en-US")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
