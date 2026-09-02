export function isoDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function slugifyFilename(value: string, fallback = "product") {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || fallback;
}

export function attachmentFilename(name: string, contentType: string) {
  const escaped = name.replace(/["\\]/g, "_");
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${escaped}"`,
    "Cache-Control": "no-store",
  };
}
