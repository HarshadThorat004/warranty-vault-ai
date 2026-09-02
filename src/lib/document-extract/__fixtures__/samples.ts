import { gstinCheckDigit, isValidImei } from "@/lib/document-extract/validate";

function validImei(body14: string) {
  for (let digit = 0; digit <= 9; digit += 1) {
    const candidate = `${body14}${digit}`;
    if (isValidImei(candidate)) return candidate;
  }

  throw new Error("Could not build a valid IMEI");
}

export const SAMPLE_GSTIN = `27AABCU9603R1Z${gstinCheckDigit("27AABCU9603R1Z")}`;
export const SAMPLE_IMEI = validImei("35693803564380");

export const AMAZON_INVOICE = `
amazon.in
Sold By:
Amazon Seller Services Private Limited
GSTIN: ${SAMPLE_GSTIN}

Order Number: 406-9607682-5448349
Invoice Number: INV-DEL-2025-88421
Order Date: 24.07.2025
Invoice Date: 24.07.2025

1 Sony WH-1000XM5 Wireless Headphones ₹24,990.00

Grand Total: Rs. 24990.00
`.trim();

export const FLIPKART_INVOICE = `
Flipkart Internet Private Limited
Order ID: OD435013516609339100
Invoice Number: FBF1526004495780
Invoice Date: 12/06/2025
GSTIN: ${SAMPLE_GSTIN}

Product Title
Samsung Galaxy S24 256GB
[IMEI/Serial No: ${SAMPLE_IMEI} ]
Warranty: 1 Year on Device

Grand Total: Rs. 72999.00
`.trim();

export const CROMA_GST_INVOICE = `
TAX INVOICE
Croma
Infiniti Retail Limited
GSTIN: ${SAMPLE_GSTIN}
Invoice No: CR/2526/001234
Invoice Date: 15/03/2025

Particulars
LG 1.5 Ton Split AC Dual Inverter
Brand: LG
Serial No: LGAC15T2025X
HSN: 8415

Manufacturer Warranty: 12 months
Grand Total: Rs. 42990.00
`.trim();

export const LOCAL_GST_INVOICE = `
TAX INVOICE
Shree Electronics
GSTIN: ${SAMPLE_GSTIN}
Invoice No: SE/25-26/00412
Invoice Date: 18/02/2025

Particulars
Bosch 8kg Front Load Washing Machine
Brand: Bosch
Serial No: BOSCH-FL-88912
HSN: 8450

Warranty Period: 24 months
Grand Total: Rs. 32490.00
`.trim();

export const WARRANTY_CARD = `
WARRANTY CARD
Brand: LG
Product: LG Dual Inverter Split AC
Model Name: TS-Q19UNZE
Serial No: 3AB12C345678
Date of Purchase: 08/01/2025
Warranty Period: 12 months
`.trim();

export const HINDI_INVOICE = `
कर चालान
चालान संख्या: INV-HIN-2044
दिनांक: 15/06/2024
ब्रांड: Samsung
विवरण: Galaxy A35
सीरियल नंबर: ${SAMPLE_IMEI}
वारंटी अवधि: 12 महीने
कुल राशि: ₹24999
`.trim();
