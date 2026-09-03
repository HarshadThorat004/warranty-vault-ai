import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

import { canAutofillField } from "@/lib/document-extract/apply-scan";
import type { ScanDocumentType } from "@/lib/document-extract/merge-scan";
import {
  emptyExtractedFields,
  type ExtractedDocumentFields,
  type FieldConfidence,
} from "@/lib/document-extract/types";
import { getHouseholdIdForUser } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { computeExpiryFromPeriod } from "@/lib/warranty";

export const INBOUND_DRAFT_STATUS = {
  pending: "pending",
  dismissed: "dismissed",
  accepted: "accepted",
} as const;

export type InboundDraftFile = {
  fileUrl: string;
  fileType: string;
  documentType: "Invoice" | "Warranty Card" | "Other";
  filename: string;
};

const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function getInboundEmailDomain() {
  return (
    process.env.INBOUND_EMAIL_DOMAIN?.trim().toLowerCase() ||
    "inbound.warrantyvault.in"
  );
}

export function inboundAddressForSlug(slug: string) {
  return `${slug}@${getInboundEmailDomain()}`;
}

export function generateInboundSlug() {
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length]).join(
    ""
  );
}

export function extractEmailAddress(raw: string) {
  const trimmed = raw.trim().toLowerCase();
  const angled = trimmed.match(/<([^>]+)>/);
  return (angled?.[1] || trimmed).trim();
}

export function parseInboundSlug(recipients: string[]) {
  const domain = getInboundEmailDomain();

  for (const raw of recipients) {
    const email = extractEmailAddress(raw);
    const at = email.lastIndexOf("@");
    if (at <= 0) continue;

    const host = email.slice(at + 1);
    if (host !== domain) continue;

    const local = email.slice(0, at).split("+")[0]?.replace(/[^a-z0-9]/g, "");
    if (local) return local;
  }

  return null;
}

export function isUsableInboundAttachment(input: {
  filename?: string | null;
  contentType?: string | null;
  contentDisposition?: string | null;
}) {
  const filename = (input.filename || "").toLowerCase();
  const mime = (input.contentType || "").split(";")[0]?.trim().toLowerCase();
  const disposition = (input.contentDisposition || "").toLowerCase();

  if (
    /pixel|spacer|tracking|beacon|logo[_-]?small|icon[_-]?/.test(filename)
  ) {
    return false;
  }

  const looksAllowed =
    (mime && ALLOWED_MIME.has(mime)) ||
    /\.(pdf|jpe?g|png|webp)$/.test(filename);

  if (!looksAllowed) return false;

  if (disposition.includes("inline") && !filename && mime?.startsWith("image/")) {
    return false;
  }

  return true;
}

export function inferInboundDocumentType(input: {
  filename?: string | null;
  subject?: string | null;
}): ScanDocumentType {
  const hay = `${input.filename || ""} ${input.subject || ""}`.toLowerCase();
  if (/warrant/.test(hay)) return "Warranty Card";
  return "Invoice";
}

const FORM_KEYS = [
  "name",
  "brand",
  "model",
  "category",
  "retailer",
  "serialNumber",
  "invoiceNumber",
  "purchaseAmount",
  "purchaseDate",
] as const;

export function inboundFilesToDocuments(files: unknown): InboundDraftFile[] {
  if (!Array.isArray(files)) return [];

  return files.flatMap((file) => {
    if (!file || typeof file !== "object") return [];
    const row = file as Partial<InboundDraftFile>;
    if (!row.fileUrl) return [];
    const documentType =
      row.documentType === "Warranty Card" || row.documentType === "Other"
        ? row.documentType
        : "Invoice";
    return [
      {
        fileUrl: row.fileUrl,
        fileType: row.fileType === "pdf" ? "pdf" : "image",
        documentType,
        filename: row.filename || "attachment",
      },
    ];
  });
}

export function draftExtractToFormValues(extracted: ExtractedDocumentFields | null) {
  const fields = {
    ...emptyExtractedFields(),
    ...(extracted ?? {}),
    fieldMeta: extracted?.fieldMeta ?? {},
  };
  const values: {
    name: string;
    brand: string;
    model: string;
    category: string;
    retailer: string;
    serialNumber: string;
    invoiceNumber: string;
    purchaseAmount: string;
    purchaseDate: string;
    warrantyExpiry: string;
  } = {
    name: "",
    brand: "",
    model: "",
    category: "",
    retailer: "",
    serialNumber: "",
    invoiceNumber: "",
    purchaseAmount: "",
    purchaseDate: "",
    warrantyExpiry: "",
  };

  for (const key of FORM_KEYS) {
    const raw = fields[key];
    const hasValue = typeof raw === "string" && raw.trim().length > 0;
    if (
      !canAutofillField({
        hasValue,
        userEdited: false,
        confidence: fields.fieldMeta[key]?.confidence,
      })
    ) {
      continue;
    }
    values[key] = String(raw).trim();
  }

  if (values.purchaseDate && fields.warrantyPeriod) {
    const expiry = computeExpiryFromPeriod(values.purchaseDate, fields.warrantyPeriod);
    const expiryConfidence: FieldConfidence | undefined =
      fields.fieldMeta.warrantyPeriod?.confidence;
    if (
      expiry &&
      canAutofillField({
        hasValue: true,
        userEdited: false,
        confidence: expiryConfidence,
      })
    ) {
      values.warrantyExpiry = expiry;
    }
  }

  return values;
}

export async function ensureInboundSlug(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { inboundSlug: true },
  });

  if (existing?.inboundSlug) {
    return existing.inboundSlug;
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = generateInboundSlug();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { inboundSlug: slug },
        select: { inboundSlug: true },
      });
      return updated.inboundSlug!;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not allocate an inbound address");
}

export async function listPendingInboundDrafts(userId: string) {
  const householdId = await getHouseholdIdForUser(userId);
  return prisma.inboundDraft.findMany({
    where: {
      status: INBOUND_DRAFT_STATUS.pending,
      ...(householdId
        ? { householdId }
        : { userId, householdId: null }),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getAccessibleInboundDraft(userId: string, draftId: string) {
  const householdId = await getHouseholdIdForUser(userId);
  return prisma.inboundDraft.findFirst({
    where: {
      id: draftId,
      ...(householdId
        ? { householdId }
        : { userId, householdId: null }),
    },
  });
}

export function inboundDraftFileUrls(files: unknown) {
  if (!Array.isArray(files)) return [];
  return files
    .map((file) =>
      file && typeof file === "object" && "fileUrl" in file
        ? String((file as { fileUrl?: string }).fileUrl || "")
        : ""
    )
    .filter(Boolean);
}

export async function collectInboundDraftFiles(userId: string) {
  const drafts = await prisma.inboundDraft.findMany({
    where: { userId },
    select: { files: true },
  });
  return drafts.flatMap((draft) => inboundDraftFileUrls(draft.files));
}

export async function dismissInboundDraft(userId: string, draftId: string) {
  const draft = await getAccessibleInboundDraft(userId, draftId);
  if (!draft || draft.status !== INBOUND_DRAFT_STATUS.pending) {
    return null;
  }

  await prisma.inboundDraft.update({
    where: { id: draft.id },
    data: { status: INBOUND_DRAFT_STATUS.dismissed },
  });
  return draft;
}

export async function acceptInboundDraft(userId: string, draftId: string, productId?: string) {
  const draft = await getAccessibleInboundDraft(userId, draftId);
  if (!draft || draft.status !== INBOUND_DRAFT_STATUS.pending) {
    return null;
  }

  return prisma.inboundDraft.update({
    where: { id: draft.id },
    data: {
      status: INBOUND_DRAFT_STATUS.accepted,
      acceptedProductId: productId ?? null,
    },
  });
}
