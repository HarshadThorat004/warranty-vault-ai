import { z } from "zod";

const documentSchema = z.object({
  fileUrl: z.string().url("Invalid document URL"),
  fileType: z.string().min(1),
  documentType: z.enum(["Invoice", "Warranty Card", "Other"]),
});

const baseProductFields = {
  name: z.string().min(1, "Product name is required").max(200),
  brand: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  warrantyExpiry: z.string().min(1, "Warranty expiry is required"),
  notes: z.string().max(2000).optional().nullable(),
  renewalAvailable: z.boolean().optional(),
  renewalNotes: z.string().max(500).optional().nullable(),
  invoiceImage: z.string().url().optional().nullable(),
  documents: z.array(documentSchema).max(10, "You can upload up to 10 documents").optional(),
};

function refineDates(
  data: { purchaseDate: string; warrantyExpiry: string },
  ctx: z.RefinementCtx
) {
  const purchase = new Date(data.purchaseDate);
  const expiry = new Date(data.warrantyExpiry);

  if (Number.isNaN(purchase.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid purchase date",
      path: ["purchaseDate"],
    });
  }

  if (Number.isNaN(expiry.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid warranty expiry date",
      path: ["warrantyExpiry"],
    });
  }

  if (
    !Number.isNaN(purchase.getTime()) &&
    !Number.isNaN(expiry.getTime()) &&
    expiry < purchase
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Warranty expiry must be on or after purchase date",
      path: ["warrantyExpiry"],
    });
  }
}

export const productCreateSchema = z
  .object(baseProductFields)
  .superRefine(refineDates);

export const productUpdateSchema = z
  .object({
    ...baseProductFields,
    purchaseDate: z.string().optional(),
    warrantyExpiry: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseDate && data.warrantyExpiry) {
      refineDates(
        {
          purchaseDate: data.purchaseDate,
          warrantyExpiry: data.warrantyExpiry,
        },
        ctx
      );
    }
  });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
