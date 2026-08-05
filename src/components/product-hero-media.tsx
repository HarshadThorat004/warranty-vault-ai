"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

import DocumentViewer, {
  isPdfDocument,
  type ViewerDocument,
} from "@/components/document-viewer";
import PdfPlaceholder from "@/components/pdf-placeholder";

type Doc = {
  id: string;
  fileUrl: string;
  fileType: string;
  documentType: string;
};

type Props = {
  thumbnail: string | null;
  productName: string;
  documents: Doc[];
  /** When true, show PDF placeholder instead of a broken image / empty state */
  pdfCover?: boolean;
};

export default function ProductHeroMedia({
  thumbnail,
  productName,
  documents,
  pdfCover = false,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const viewerDocs: ViewerDocument[] = useMemo(
    () =>
      documents.map((doc) => ({
        id: doc.id,
        url: doc.fileUrl,
        title: doc.documentType,
        fileType: doc.fileType,
      })),
    [documents]
  );

  const matchedDoc = thumbnail
    ? documents.find((doc) => doc.fileUrl === thumbnail)
    : null;

  const firstPdf = documents.find((doc) =>
    isPdfDocument({ url: doc.fileUrl, fileType: doc.fileType })
  );

  const openableDoc =
    matchedDoc &&
    !isPdfDocument({ url: matchedDoc.fileUrl, fileType: matchedDoc.fileType })
      ? matchedDoc
      : firstPdf && pdfCover
        ? firstPdf
        : matchedDoc &&
            isPdfDocument({
              url: matchedDoc.fileUrl,
              fileType: matchedDoc.fileType,
            })
          ? matchedDoc
          : null;

  const showPdfPlaceholder =
    pdfCover ||
    (matchedDoc
      ? isPdfDocument({
          url: matchedDoc.fileUrl,
          fileType: matchedDoc.fileType,
        })
      : false) ||
    (thumbnail
      ? isPdfDocument({ url: thumbnail, fileType: matchedDoc?.fileType })
      : false);

  if (!thumbnail && !pdfCover) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-gray-600">
        <Package size={40} />
      </div>
    );
  }

  if (showPdfPlaceholder) {
    const content = (
      <PdfPlaceholder
        sizeClassName="min-h-[260px]"
        label={openableDoc?.documentType ?? "PDF document"}
      />
    );

    if (!openableDoc) {
      return content;
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setActiveId(openableDoc.id)}
          className="group relative block h-full min-h-[260px] w-full text-left"
          aria-label={`View ${openableDoc.documentType}`}
        >
          {content}
          <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent pb-4 opacity-0 transition group-hover:opacity-100">
            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs text-white">
              Click to view PDF
            </span>
          </span>
        </button>

        <DocumentViewer
          documents={viewerDocs}
          activeId={activeId}
          open={activeId !== null}
          onClose={() => setActiveId(null)}
          onChange={setActiveId}
        />
      </>
    );
  }

  if (!matchedDoc) {
    return (
      <Image
        src={thumbnail!}
        alt={productName}
        width={1200}
        height={900}
        priority
        className="h-full min-h-[260px] w-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setActiveId(matchedDoc.id)}
        className="group relative block h-full min-h-[260px] w-full"
        aria-label={`View ${matchedDoc.documentType}`}
      >
        <Image
          src={thumbnail!}
          alt={productName}
          width={1200}
          height={900}
          priority
          className="h-full min-h-[260px] w-full object-cover transition group-hover:opacity-90"
          unoptimized
        />
        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent pb-4 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs text-white">
            Click to view
          </span>
        </span>
      </button>

      <DocumentViewer
        documents={viewerDocs}
        activeId={activeId}
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        onChange={setActiveId}
      />
    </>
  );
}
