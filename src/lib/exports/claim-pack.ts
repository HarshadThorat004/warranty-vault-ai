import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { categoryLabel, extendedCoverLabel } from "@/constants/catalog";
import { getServiceChecklist } from "@/constants/service-checklist";
import { isoDate } from "@/lib/exports/format";
import { isAllowedRemoteUrl } from "@/lib/url-allowlist";

export type ClaimPackDocument = {
  fileUrl: string;
  fileType: string;
  documentType: string;
};

export type ClaimPackProduct = {
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  retailer: string | null;
  serialNumber: string | null;
  invoiceNumber: string | null;
  purchaseAmount: string | null;
  purchaseDate: Date | string | null;
  warrantyExpiry: Date | string | null;
  extendedExpiry?: Date | string | null;
  extendedType?: string | null;
  notes: string | null;
  renewalAvailable: boolean;
  renewalNotes: string | null;
  invoiceImage: string | null;
  documents: ClaimPackDocument[];
};

const ink = rgb(0.1, 0.1, 0.12);
const muted = rgb(0.4, 0.4, 0.42);
const rule = rgb(0.85, 0.85, 0.86);

function wrap(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

async function embedFirstImage(pdf: PDFDocument, product: ClaimPackProduct) {
  const candidates = [
    product.invoiceImage,
    ...product.documents
      .filter((doc) => doc.fileType !== "pdf")
      .map((doc) => doc.fileUrl),
  ].filter((url): url is string => Boolean(url && isAllowedRemoteUrl(url)));

  const url = candidates[0];
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = (response.headers.get("content-type") ?? "").toLowerCase();

    if (type.includes("png") || bytes[0] === 0x89) {
      return pdf.embedPng(bytes);
    }

    if (type.includes("jpeg") || type.includes("jpg") || bytes[0] === 0xff) {
      return pdf.embedJpg(bytes);
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }

  return null;
}

export async function buildClaimPackPdf(product: ClaimPackProduct) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const heading = await pdf.embedFont(StandardFonts.HelveticaBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const left = 48;
  const maxWidth = width - 96;
  let y = height - 56;

  page.drawText("WARRANTY VAULT", {
    x: left,
    y,
    size: 10,
    font: heading,
    color: muted,
  });
  y -= 22;
  page.drawText("Claim pack", {
    x: left,
    y,
    size: 22,
    font: heading,
    color: ink,
  });
  y -= 16;
  page.drawText(
    `Generated ${isoDate(new Date())}  ·  For service centre, manufacturer, or insurer`,
    {
      x: left,
      y,
      size: 9,
      font: body,
      color: muted,
    }
  );
  y -= 14;
  page.drawLine({
    start: { x: left, y },
    end: { x: width - 48, y },
    thickness: 1,
    color: rule,
  });
  y -= 28;

  const titleLines = wrap(product.name, heading, 16, maxWidth);
  for (const line of titleLines) {
    page.drawText(line, { x: left, y, size: 16, font: heading, color: ink });
    y -= 20;
  }
  y -= 8;

  const fields: Array<[string, string]> = [
    ["Brand", product.brand || "—"],
    ["Model", product.model || "—"],
    ["Category", categoryLabel(product.category) || product.category || "—"],
    ["Retailer", product.retailer || "—"],
    ["Serial / IMEI", product.serialNumber || "—"],
    ["Invoice number", product.invoiceNumber || "—"],
    ["Purchase date", isoDate(product.purchaseDate) || "—"],
    ["Manufacturer warranty", isoDate(product.warrantyExpiry) || "—"],
    [
      extendedCoverLabel(product.extendedType),
      isoDate(product.extendedExpiry) || "—",
    ],
    [
      "Amount",
      product.purchaseAmount ? `INR ${product.purchaseAmount}` : "—",
    ],
    [
      "Renewal",
      product.renewalAvailable
        ? product.renewalNotes || "Available"
        : "Not marked",
    ],
  ];

  for (const [label, value] of fields) {
    page.drawText(label, { x: left, y, size: 8, font: heading, color: muted });
    const valueLines = wrap(value, body, 11, maxWidth - 130);
    let valueY = y - 2;
    page.drawText(valueLines[0] ?? "—", {
      x: left + 130,
      y: valueY,
      size: 11,
      font: body,
      color: ink,
    });
    for (const extra of valueLines.slice(1)) {
      valueY -= 14;
      page.drawText(extra, {
        x: left + 130,
        y: valueY,
        size: 11,
        font: body,
        color: ink,
      });
    }
    y = valueY - 18;
  }

  if (product.notes?.trim()) {
    y -= 4;
    page.drawText("Notes", { x: left, y, size: 8, font: heading, color: muted });
    y -= 14;
    for (const line of wrap(product.notes.replace(/\s+/g, " "), body, 10, maxWidth)) {
      page.drawText(line, { x: left, y, size: 10, font: body, color: ink });
      y -= 14;
      if (y < 160) break;
    }
    y -= 6;
  }

  const docs = product.documents;
  page.drawText("Attached documents", {
    x: left,
    y,
    size: 8,
    font: heading,
    color: muted,
  });
  y -= 14;

  if (docs.length === 0) {
    page.drawText("No files attached in the vault.", {
      x: left,
      y,
      size: 10,
      font: body,
      color: ink,
    });
    y -= 16;
  } else {
    for (const doc of docs.slice(0, 8)) {
      page.drawText(`${doc.documentType} (${doc.fileType || "file"})`, {
        x: left,
        y,
        size: 10,
        font: body,
        color: ink,
      });
      y -= 14;
    }
  }

  const image = await embedFirstImage(pdf, product);
  if (image && y > 220) {
    y -= 10;
    const maxH = Math.min(180, y - 48);
    const scale = Math.min(maxWidth / image.width, maxH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    y -= drawH;
    page.drawImage(image, {
      x: left,
      y,
      width: drawW,
      height: drawH,
    });
  }

  page.drawText(
    "Keep this pack with your original invoice and warranty card when filing a claim.",
    {
      x: left,
      y: 36,
      size: 8,
      font: body,
      color: muted,
    }
  );

  const checklist = getServiceChecklist(product.category);
  const listPage = pdf.addPage([595, 842]);
  let listY = height - 56;

  listPage.drawText("SERVICE CHECKLIST", {
    x: left,
    y: listY,
    size: 10,
    font: heading,
    color: muted,
  });
  listY -= 22;
  listPage.drawText(checklist.title, {
    x: left,
    y: listY,
    size: 16,
    font: heading,
    color: ink,
  });
  listY -= 18;
  listPage.drawText("Tick these off at the service centre. Do not leave originals behind.", {
    x: left,
    y: listY,
    size: 9,
    font: body,
    color: muted,
  });
  listY -= 16;
  listPage.drawLine({
    start: { x: left, y: listY },
    end: { x: width - 48, y: listY },
    thickness: 1,
    color: rule,
  });
  listY -= 28;

  for (const item of checklist.items) {
    listPage.drawRectangle({
      x: left,
      y: listY - 2,
      width: 11,
      height: 11,
      borderWidth: 1,
      borderColor: ink,
    });
    const lines = wrap(item, body, 11, maxWidth - 22);
    let itemY = listY;
    for (const line of lines) {
      listPage.drawText(line, {
        x: left + 20,
        y: itemY,
        size: 11,
        font: body,
        color: ink,
      });
      itemY -= 16;
    }
    listY = itemY - 10;
  }

  listPage.drawText(
    `${product.name}  ·  Warranty Vault claim pack`,
    {
      x: left,
      y: 36,
      size: 8,
      font: body,
      color: muted,
    }
  );

  return pdf.save();
}
