"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";

import DocumentViewer, {
  isPdfDocument,
  type ViewerDocument,
} from "@/components/document-viewer";
import PdfPlaceholder from "@/components/pdf-placeholder";

type DocumentItem = {
  id: string;
  fileUrl: string;
  fileType: string;
  documentType: string;
};

type Props = {
  documents: DocumentItem[];
};

export default function ProductDocuments({ documents }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const viewerDocs: ViewerDocument[] = documents.map((doc) => ({
    id: doc.id,
    url: doc.fileUrl,
    title: doc.documentType,
    fileType: doc.fileType,
  }));

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
        <FileText className="mx-auto text-gray-600" size={28} />
        <p className="mt-3 text-sm font-medium text-gray-300">No documents yet</p>
        <p className="mt-1 text-xs text-gray-500">Add files from the edit page.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => {
          const pdf = isPdfDocument({
            url: doc.fileUrl,
            fileType: doc.fileType,
          });

          return (
            <div
              key={doc.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <p className="text-sm font-medium text-white">
                  {doc.documentType}
                </p>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-cyan-300 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  Open in new tab
                </a>
              </div>

              <button
                type="button"
                onClick={() => setActiveId(doc.id)}
                className="group relative block w-full text-left"
                aria-label={`View ${doc.documentType}`}
              >
                {pdf ? (
                  <PdfPlaceholder
                    sizeClassName="h-48"
                    label={doc.documentType}
                  />
                ) : (
                  <Image
                    src={doc.fileUrl}
                    alt={doc.documentType}
                    width={1200}
                    height={900}
                    className="h-48 w-full object-cover transition group-hover:opacity-90"
                    unoptimized
                  />
                )}
                <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent pb-3 opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs text-white">
                    Click to view
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

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
