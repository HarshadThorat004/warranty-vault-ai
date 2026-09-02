/**
 * Field-name aliases trained for popular Indian invoices & warranty cards:
 * Amazon, Flipkart, DMart, Croma, Reliance Digital, Vijay Sales, local stores, etc.
 */

export type FieldKey =
  | "invoiceNumber"
  | "serialNumber"
  | "purchaseDate"
  | "brand"
  | "name"
  | "warrantyPeriod";

/** OCR-tolerant warranty / guarantee keywords */
export const WARRANTY_WORD =
  "(?:warr?anty|warrenty|waranty|guar+antee|garrantee|garantee|guaranty|garranty|assurance)";

export const LABEL_ALIASES: Record<FieldKey, RegExp[]> = {
  invoiceNumber: [
    /^(?:tax\s*)?invoice\s*(?:no|number|num|#|n[o0])\.?$/i,
    /^(?:invoice)\s*(?:details)?$/i,
    /^(?:bill|receipt|cash\s*memo|memo)\s*(?:no|number|num|#)\.?$/i,
    /^(?:bill\s*of\s*supply)\s*(?:no|number|num|#)?\.?$/i,
    /^inv(?:oice)?\s*(?:no|number|#)?\.?$/i,
    /^(?:order)\s*(?:id|no|number|num|#)\.?$/i,
    /^(?:order)$/i,
    /^(?:shipment)\s*(?:id|no|number)?\.?$/i,
    /^(?:transaction)\s*(?:id|no|number|#)?\.?$/i,
    /^(?:ref(?:erence)?)\s*(?:no|number|#)\.?$/i,
    /^(?:irn|invoice\s*reference\s*(?:no|number)?)$/i,
    /^(?:document)\s*(?:no|number|#)\.?$/i,
    /^(?:voucher)\s*(?:no|number|#)\.?$/i,
    /^(?:challan)\s*(?:no|number|#)\.?$/i,
    /^(?:चालान|इनवॉइस|इनवोइस)(?:\s*(?:संख्या|नंबर|नम्बर|नं\.?))?$/u,
    /^(?:बिल)(?:\s*(?:संख्या|नंबर|नं\.?))?$/u,
  ],
  serialNumber: [
    /^(?:serial(?:\s*(?:no|number|#))?|sr\.?\s*no|s\/n|sl\.?\s*no|sno)\.?$/i,
    /^(?:imei(?:\s*(?:no|number|#|1|2))?)$/i,
    /^(?:imei\s*\/\s*serial(?:\s*(?:no|number)?)?)$/i,
    /^(?:serial\s*\/\s*imei)$/i,
    /^(?:chassis|device|unit)\s*(?:no|number|#)?\.?$/i,
    /^(?:product)\s*(?:serial|sr\.?\s*no)\.?$/i,
    /^(?:barcode|ean|upc)$/i,
    /^(?:सीरियल|क्रमांक|क्रम\s*संख्या)(?:\s*(?:नंबर|नं\.?))?$/u,
    /^(?:आईएमईआई)$/u,
  ],
  purchaseDate: [
    /^(?:date\s*of\s*purchase|purchase\s*date|dop)$/i,
    /^(?:invoice\s*date|bill\s*date|order\s*date|sale\s*date|sold\s*date)$/i,
    /^(?:bill\s*of\s*supply\s*date)$/i,
    /^(?:delivery\s*date|ship(?:ping)?\s*date)$/i,
    /^(?:dated|sold\s*on|billing\s*date)$/i,
    /^(?:date)$/i,
    /^(?:दिनांक|तारीख|खरीद\s*तिथि|बिल\s*तिथि)$/u,
  ],
  brand: [
    /^brand$/i,
    /^manufacturer$/i,
    /^make$/i,
    /^company$/i,
    /^oem$/i,
    /^mfr\.?$/i,
    /^(?:ब्रांड|निर्माता|कंपनी)$/u,
  ],
  name: [
    /^(?:product|item|description|particulars|goods|commodity)(?:\s*name|\s*desc|\s*title)?$/i,
    /^(?:product\s*title|item\s*title|item\s*name|item\s*description)$/i,
    /^(?:model(?:\s*name|\s*no|\s*number)?|product\s*details|article)$/i,
    /^(?:title|sku\s*name|product\s*info)$/i,
    /^(?:hsn\s*description|goods\s*description)$/i,
    /^(?:विवरण|वस्तु|उत्पाद|सामान)$/u,
  ],
  warrantyPeriod: [
    new RegExp(
      `^(?:${WARRANTY_WORD}|guarantee)\\s*(?:period|valid(?:ity)?|term|cover(?:age)?|available|info|details)?$`,
      "i"
    ),
    /^(?:valid(?:ity)?|cover(?:age)?)\s*(?:period|term|until)?$/i,
    /^(?:manufacturer\s*warranty|brand\s*warranty|standard\s*warranty)$/i,
    /^(?:service\s*period|support\s*period)$/i,
    /^(?:वारंटी|गारंटी)(?:\s*(?:अवधि|काल|पीरियड))?$/u,
  ],
};

/** Compact same-line label starters for Indian retail invoices */
export const COMPACT_LABEL_PREFIX =
  /^(?:(?:tax\s*)?invoice\s*(?:no|number|#)?|bill\s*(?:no|number|#)?|bill\s*of\s*supply\s*(?:no|number)?|order\s*(?:id|no|number|#)?|order|receipt\s*(?:no|number)?|cash\s*memo\s*(?:no)?|serial\s*(?:no|number)?|sr\.?\s*no|s\/n|imei(?:\s*\/\s*serial(?:\s*no)?)?|brand|manufacturer|make|model(?:\s*name|\s*no)?|product(?:\s*name|\s*title)?|item(?:\s*name|\s*title)?|description|particulars|product\s*title|purchase\s*date|invoice\s*date|order\s*date|date\s*of\s*purchase|bill\s*date|warranty(?:\s*period)?|guarantee(?:\s*period)?|irn)\b/i;

export const COMMON_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "LG",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "ASUS",
  "Acer",
  "Microsoft",
  "OnePlus",
  "Xiaomi",
  "Redmi",
  "Realme",
  "Oppo",
  "Vivo",
  "iQOO",
  "Motorola",
  "Nokia",
  "Panasonic",
  "Philips",
  "Bosch",
  "Whirlpool",
  "Godrej",
  "Haier",
  "IFB",
  "Voltas",
  "Daikin",
  "Blue Star",
  "Lloyd",
  "Carrier",
  "Hitachi",
  "Croma",
  "Boat",
  "boAt",
  "JBL",
  "Sony",
  "Canon",
  "Nikon",
  "Epson",
  "Brother",
  "MSI",
  "Gigabyte",
  "ROG",
  "Honor",
  "Nothing",
  "Google",
  "Amazon",
  "Fire-Boltt",
  "Noise",
  "Poco",
  "Infinix",
  "Tecno",
  "Lava",
  "Micromax",
  "Hindware",
  "Bajaj",
  "Havells",
  "Syska",
  "Prestige",
  "Kent",
  "Aquaguard",
  "Tupperware",
  "Nike",
  "Adidas",
  "Puma",
  "Yonex",
  "Fastrack",
  "Titan",
  "Sonata",
  "Casio",
  "Fitbit",
  "Garmin",
  "Dyson",
  "Mi",
  "Huawei",
  "TCL",
  "Vu",
  "Hisense",
  "Toshiba",
  "Sharp",
  "Wipro",
  "Orient",
  "Usha",
  "Crompton",
  "Symphony",
  "Morphy Richards",
  "Black+Decker",
  "Makita",
  "Bosch",
];

export const PRODUCT_HINT =
  /\b(laptop|notebook|ultrabook|chromebook|phone|mobile|smartphone|handset|tablet|ipad|tv|television|smart\s*tv|monitor|refrigerator|fridge|washer|washing\s*machine|ac\b|air\s*conditioner|split\s*ac|headphones?|earbuds?|earphones?|watch|smartwatch|router|camera|printer|console|keyboard|mouse|ssd|hdd|gpu|graphics|mixer|grinder|geyser|microwave|oven|induction|purifier|fan|cooler|inverter|powerbank|charger|cable|speaker|soundbar|dishwasher|vacuum|trimmer|shaver|iron|kettle)\b/i;

export const NOISE_LINE =
  /^(total|sub\s*total|grand\s*total|gst|cgst|sgst|igst|tax|amount|qty|quantity|price|rate|hsn|sac|fsn|asin|thank\s*you|terms|conditions|bill\s*to|ship\s*to|sold\s*to|ship(?:ping)?\s*address|billing\s*address|customer|address|phone|mobile|email|www\.|http|gstin|gst\s*reg|pan\b|cin\b|state\b|place\s*of\s*supply|place\s*of\s*delivery|bank\s*details|account|ifsc|signature|authorized|page\s*\d|continued|round\s*off|discount|coupon|promo|payment|mode\s*of\s*payment|amount\s*in\s*words|whether\s*tax|reverse\s*charge|nature\s*of\s*supply|e\.\s*&\s*o\.e)/i;

export type RetailerId =
  | "amazon"
  | "flipkart"
  | "dmart"
  | "croma"
  | "reliance"
  | "vijay_sales"
  | "local"
  | "unknown";

export function detectRetailer(text: string): RetailerId {
  const lower = text.toLowerCase();

  if (
    /amazon\.in|amazon seller services|amazonsellerservices|retail\s*ez|amazon\.com/.test(
      lower
    )
  ) {
    return "amazon";
  }

  if (/flipkart|fsn\s*:|order\s*id\s*:?\s*od\d+/i.test(lower)) {
    return "flipkart";
  }

  if (/d-?mart|avenue\s*supermarts|dmart/.test(lower)) {
    return "dmart";
  }

  if (/croma|infiniti\s*retail/.test(lower)) {
    return "croma";
  }

  if (/reliance\s*digital|reliance\s*retail|jiomart|reliancedigital/.test(lower)) {
    return "reliance";
  }

  if (/vijay\s*sales/.test(lower)) {
    return "vijay_sales";
  }

  if (
    /\b(retail|supermarket|hypermarket|electronics|mobiles|showroom|store)\b/i.test(
      lower
    )
  ) {
    return "local";
  }

  return "unknown";
}
