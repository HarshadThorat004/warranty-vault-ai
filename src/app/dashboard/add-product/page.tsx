import Link from "next/link";
import { X } from "lucide-react";

import DashboardShell from "@/components/dashboard-shell";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductForm from "@/components/product-form";
import { getSessionUser } from "@/lib/product-access";
import {
  draftExtractToFormValues,
  getAccessibleInboundDraft,
  inboundFilesToDocuments,
  INBOUND_DRAFT_STATUS,
} from "@/lib/inbound";
import type { ExtractedDocumentFields } from "@/lib/document-extract/types";

type Props = {
  searchParams: Promise<{ draft?: string }>;
};

export default async function AddProductPage({ searchParams }: Props) {
  const { draft: draftId } = await searchParams;
  const user = await getSessionUser();

  let inboundDraftId: string | undefined;
  let defaultValues:
    | ReturnType<typeof draftExtractToFormValues> & {
        documents: ReturnType<typeof inboundFilesToDocuments>;
        invoiceImage?: string | null;
        notes?: string;
      }
    | undefined;

  if (draftId && user) {
    const draft = await getAccessibleInboundDraft(user.id, draftId);
    if (draft && draft.status === INBOUND_DRAFT_STATUS.pending) {
      inboundDraftId = draft.id;
      const extracted = (draft.extracted ??
        null) as ExtractedDocumentFields | null;
      const files = inboundFilesToDocuments(draft.files);
      const form = draftExtractToFormValues(extracted);
      defaultValues = {
        ...form,
        documents: files,
        invoiceImage:
          files.find((file) => file.fileType !== "pdf")?.fileUrl ?? null,
        notes: draft.subject
          ? `Forwarded email: ${draft.subject}`
          : undefined,
      };
    }
  }

  return (
    <DashboardShell className="max-w-3xl">
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Add product" },
          ]}
        />

        <div className="relative rounded-2xl border border-white/10 bg-neutral-950/80 p-6 md:p-8">
          <Link
            href="/dashboard"
            aria-label="Cancel and return to dashboard"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/5 hover:text-white md:right-6 md:top-6"
          >
            <X size={18} />
          </Link>

          <p className="pr-12 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">
            {inboundDraftId ? "Email draft" : "New product"}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {inboundDraftId ? "Review forwarded invoice" : "Add product"}
          </h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            {inboundDraftId
              ? "Check the filled fields, complete anything missing, then save. Empty is better than a wrong expiry date."
              : "Scan an invoice or warranty card to auto-fill, then complete any missing details."}
          </p>

          <div className="mt-8">
            <ProductForm
              mode="create"
              inboundDraftId={inboundDraftId}
              defaultValues={defaultValues}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
