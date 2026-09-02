export interface ProductDocument {
  id?: string;
  fileUrl: string;
  fileType: string;
  documentType: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  model?: string | null;
  category?: string | null;
  retailer?: string | null;
  serialNumber?: string | null;
  invoiceNumber?: string | null;
  purchaseAmount?: string | null;
  purchaseDate: Date | null;
  warrantyExpiry: Date | null;
  extendedExpiry?: Date | null;
  extendedType?: string | null;
  invoiceImage: string | null;
  notes?: string | null;
  renewalAvailable?: boolean;
  renewalNotes?: string | null;
  createdAt: Date;
  userId: string;
  documents?: ProductDocument[];
}

export interface NotificationLog {
  id: string;
  userId: string;
  productId: string;
  type: string;
  channel: string;
  sentAt: Date;
  readAt: Date | null;
  dismissedAt: Date | null;
  product?: {
    id: string;
    name: string;
    brand: string | null;
    warrantyExpiry: Date | null;
  };
}
