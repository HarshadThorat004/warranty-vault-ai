import type { ProductCategoryId } from "@/constants/catalog";

export type ServiceChecklist = {
  title: string;
  items: string[];
};

const PHONES: ServiceChecklist = {
  title: "Take to the brand or retailer service centre",
  items: [
    "Printed GST tax invoice (SMS or order page is often not enough)",
    "Warranty card, or a screenshot of brand registration",
    "IMEI / serial that matches the device (*#06# or Settings > About)",
    "Device unlocked — Apple ID, Google account, and screen lock",
    "This claim pack PDF from Warranty Vault",
    "Original box only if this brand still asks for it",
  ],
};

const APPLIANCES: ServiceChecklist = {
  title: "Take to the brand, dealer, or AMC desk",
  items: [
    "Printed invoice with model and serial",
    "Warranty card (product vs compressor / PCB if they differ)",
    "Photo or note of the rating-plate serial on the machine",
    "Installation or demo report if the extra cover needs it",
    "This claim pack PDF from Warranty Vault",
  ],
};

const COMPUTERS: ServiceChecklist = {
  title: "Take to the brand service centre",
  items: [
    "Printed invoice with serial / service tag",
    "Warranty card or on-site AMC papers",
    "Serial from the underside, BIOS, or lid — matches this vault",
    "Back up files first; a bench repair can wipe the drive",
    "This claim pack PDF from Warranty Vault",
  ],
};

const TV_AUDIO: ServiceChecklist = {
  title: "Take to the brand or retailer service centre",
  items: [
    "Printed invoice with model number",
    "Warranty card",
    "Serial from the rear panel or software menu",
    "This claim pack PDF from Warranty Vault",
  ],
};

const OTHER: ServiceChecklist = {
  title: "Take when you file a claim",
  items: [
    "Printed invoice or tax invoice",
    "Warranty card or AMC papers",
    "Serial / model that matches the product",
    "This claim pack PDF from Warranty Vault",
  ],
};

const BY_CATEGORY: Record<ProductCategoryId, ServiceChecklist> = {
  phones: PHONES,
  computers: COMPUTERS,
  appliances: APPLIANCES,
  tv_audio: TV_AUDIO,
  other: OTHER,
};

export function getServiceChecklist(category?: string | null): ServiceChecklist {
  if (category && category in BY_CATEGORY) {
    return BY_CATEGORY[category as ProductCategoryId];
  }
  return OTHER;
}
