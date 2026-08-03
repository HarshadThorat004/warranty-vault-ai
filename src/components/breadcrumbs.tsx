"use client";

import Link from "next/link";

type Props = {
  items: {
    label: string;
    href?: string;
  }[];
};

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-0">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition hover:text-cyan-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-gray-300" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
