import { Prisma } from "@prisma/client";
import { Resend } from "resend";

import {
  emptyExtractedFields,
} from "@/lib/document-extract/types";
import {
  mergeByDocumentType,
  scanDocumentFromBuffer,
} from "@/lib/document-extract";
import { getHouseholdIdForUser } from "@/lib/household";
import {
  extractEmailAddress,
  inferInboundDocumentType,
  INBOUND_DRAFT_STATUS,
  isUsableInboundAttachment,
  parseInboundSlug,
  type InboundDraftFile,
} from "@/lib/inbound";
import { prisma } from "@/lib/prisma";
import { uploadInboundFile } from "@/lib/uploadthing-server";

const MAX_INBOUND_FILES = 4;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

type ListedAttachment = {
  id?: string;
  filename?: string | null;
  download_url?: string;
};

function unwrapListedAttachments(result: { data?: unknown }) {
  const payload = result.data;
  if (Array.isArray(payload)) {
    return payload as ListedAttachment[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ListedAttachment[] }).data;
  }
  return [] as ListedAttachment[];
}

type ReceivedAttachmentMeta = {
  id?: string;
  filename?: string | null;
  content_type?: string | null;
  content_disposition?: string | null;
};

export type ReceivedEmailEvent = {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    cc?: string[];
    received_for?: string[];
    subject?: string | null;
    attachments?: ReceivedAttachmentMeta[];
  };
};

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function mimeToFileType(mime: string, filename: string) {
  if (mime.includes("pdf") || filename.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  return "image";
}

export function verifyResendWebhook(rawBody: string, headers: Headers) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const resend = getResendClient();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_WEBHOOK_SECRET is required");
    }
    return JSON.parse(rawBody) as ReceivedEmailEvent;
  }

  if (!resend) {
    throw new Error("RESEND_API_KEY is required to verify inbound webhooks");
  }

  return resend.webhooks.verify({
    webhookSecret: secret,
    payload: rawBody,
    headers: {
      id: headers.get("svix-id") || headers.get("webhook-id") || "",
      timestamp:
        headers.get("svix-timestamp") ||
        headers.get("webhook-timestamp") ||
        "",
      signature:
        headers.get("svix-signature") ||
        headers.get("webhook-signature") ||
        "",
    },
  }) as ReceivedEmailEvent;
}

async function scanSoft(buffer: Buffer, mimeType: string) {
  try {
    return await scanDocumentFromBuffer(buffer, mimeType);
  } catch (error) {
    console.warn("INBOUND_SCAN_SKIPPED", error);
    return emptyExtractedFields();
  }
}

export async function ingestReceivedEmail(event: ReceivedEmailEvent) {
  if (event.type && event.type !== "email.received") {
    return { skipped: true as const, reason: "not-received" };
  }

  const data = event.data;
  if (!data?.email_id) {
    return { skipped: true as const, reason: "missing-id" };
  }

  const recipients = [
    ...(data.to ?? []),
    ...(data.cc ?? []),
    ...(data.received_for ?? []),
  ];
  const slug = parseInboundSlug(recipients);

  if (!slug) {
    return { skipped: true as const, reason: "unknown-address" };
  }

  const user = await prisma.user.findUnique({
    where: { inboundSlug: slug },
    select: { id: true },
  });

  if (!user) {
    return { skipped: true as const, reason: "unknown-slug" };
  }

  const existing = await prisma.inboundDraft.findUnique({
    where: { resendEmailId: data.email_id },
    select: { id: true },
  });

  if (existing) {
    return { skipped: true as const, reason: "duplicate", draftId: existing.id };
  }

  const householdId = await getHouseholdIdForUser(user.id);
  const resend = getResendClient();
  const files: InboundDraftFile[] = [];
  let extracted = emptyExtractedFields();

  const candidates = (data.attachments ?? [])
    .filter((attachment) =>
      isUsableInboundAttachment({
        filename: attachment.filename,
        contentType: attachment.content_type,
        contentDisposition: attachment.content_disposition,
      })
    )
    .sort((left, right) => {
      const leftPdf = (left.filename || left.content_type || "")
        .toLowerCase()
        .includes("pdf");
      const rightPdf = (right.filename || right.content_type || "")
        .toLowerCase()
        .includes("pdf");
      if (leftPdf === rightPdf) return 0;
      return leftPdf ? -1 : 1;
    })
    .slice(0, MAX_INBOUND_FILES);

  if (resend && candidates.length > 0) {
    const listed = await resend.emails.receiving.attachments.list({
      emailId: data.email_id,
    });
    const listedItems = unwrapListedAttachments(listed);

    for (const candidate of candidates) {
      const meta =
        listedItems.find(
          (item) =>
            (candidate.id && item.id === candidate.id) ||
            (candidate.filename && item.filename === candidate.filename)
        ) ?? listedItems.find((item) => item.download_url);

      const downloadUrl = meta?.download_url || "";
      if (!downloadUrl) continue;

      const response = await fetch(downloadUrl);
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_FILE_BYTES) {
        continue;
      }

      const mime =
        candidate.content_type?.split(";")[0]?.trim() ||
        response.headers.get("content-type") ||
        "application/octet-stream";
      const filename = candidate.filename || `invoice-${files.length + 1}`;
      const documentType = inferInboundDocumentType({
        filename,
        subject: data.subject,
      });

      const url = await uploadInboundFile({
        buffer,
        filename,
        mimeType: mime,
      });

      files.push({
        fileUrl: url,
        fileType: mimeToFileType(mime, filename),
        documentType,
        filename,
      });

      const scanned = await scanSoft(buffer, mime);
      extracted = mergeByDocumentType(extracted, scanned, documentType);
    }
  }

  const draft = await prisma.inboundDraft.create({
    data: {
      userId: user.id,
      householdId,
      status: INBOUND_DRAFT_STATUS.pending,
      fromEmail: data.from ? extractEmailAddress(data.from) : null,
      subject: data.subject?.slice(0, 300) || null,
      resendEmailId: data.email_id,
      extracted: extracted as unknown as Prisma.InputJsonValue,
      files: files as unknown as Prisma.InputJsonValue,
    },
  });

  return { skipped: false as const, draftId: draft.id, files: files.length };
}
