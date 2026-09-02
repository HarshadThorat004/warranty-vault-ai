import type { FieldConfidence } from "@/lib/document-extract/types";

export function hasExtractedValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Autofill contract: never overwrite a field the user already edited.
 * High/medium confidence fills; low confidence is skipped (blank is better
 * than a wrong expiry or serial).
 */
export function canAutofillField(options: {
  hasValue: boolean;
  userEdited: boolean;
  confidence?: FieldConfidence;
}) {
  if (!options.hasValue) return false;
  if (options.userEdited) return false;
  if (options.confidence === "low") return false;

  return true;
}
