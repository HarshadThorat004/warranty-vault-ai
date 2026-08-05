"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type ViewerDocument = {
  id: string;
  url: string;
  title: string;
  fileType?: string | null;
};

type Props = {
  documents: ViewerDocument[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onChange?: (id: string) => void;
};

export function isPdfDocument(doc: Pick<ViewerDocument, "url" | "fileType">) {
  if (doc.fileType?.toLowerCase() === "pdf") return true;
  return doc.url.toLowerCase().includes(".pdf");
}

export default function DocumentViewer({
  documents,
  activeId,
  open,
  onClose,
  onChange,
}: Props) {
  const activeIndex = useMemo(
    () => documents.findIndex((doc) => doc.id === activeId),
    [documents, activeId]
  );
  const active = activeIndex >= 0 ? documents[activeIndex] : null;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < documents.length - 1;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" && hasPrev && onChange) {
        onChange(documents[activeIndex - 1].id);
      }

      if (event.key === "ArrowRight" && hasNext && onChange) {
        onChange(documents[activeIndex + 1].id);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, onChange, documents, activeIndex, hasPrev, hasNext]);

  if (!open || !active) return null;

  const pdf = isPdfDocument(active);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={active.title}
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="min-w-0 truncate text-sm font-medium text-white">
          {active.title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-white/5 hover:underline"
          >
            Open in new tab
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close document"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        {hasPrev && onChange && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange(documents[activeIndex - 1].id);
            }}
            className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/10 md:left-6"
            aria-label="Previous document"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {hasNext && onChange && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange(documents[activeIndex + 1].id);
            }}
            className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/10 md:right-6"
            aria-label="Next document"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          className="relative flex max-h-full w-full max-w-5xl flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          {pdf ? (
            <iframe
              src={active.url}
              title={active.title}
              className="h-[min(78vh,calc(100vh-5.5rem))] w-full rounded-xl border border-white/10 bg-white"
            />
          ) : (
            <Image
              src={active.url}
              alt={active.title}
              width={1600}
              height={1200}
              className="mx-auto max-h-[calc(100vh-5.5rem)] w-auto max-w-full rounded-xl object-contain"
              unoptimized
            />
          )}
        </div>
      </div>
    </div>
  );
}
