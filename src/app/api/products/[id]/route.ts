import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assertProductOwner } from "@/lib/product-access";
import { deleteUploadedFiles } from "@/lib/uploadthing-server";
import { productUpdateSchema } from "@/lib/validations/product";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const access = await assertProductOwner(id);

    if (access.error || !access.product) {
      return jsonError(access.error, access.status);
    }

    return jsonSuccess(access.product);
  } catch (error) {
    console.error(error);

    return jsonError("Failed to fetch product");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const access = await assertProductOwner(id);

    if (access.error || !access.product) {
      return jsonError(access.error, access.status);
    }

    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Validation failed", 400, {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;
    const previousUrls = [
      access.product.invoiceImage,
      ...access.product.documents.map((doc) => doc.fileUrl),
    ].filter((value): value is string => Boolean(value));

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand ?? null,
        serialNumber: data.serialNumber ?? null,
        invoiceNumber: data.invoiceNumber ?? null,
        purchaseDate: data.purchaseDate
          ? new Date(data.purchaseDate)
          : undefined,
        warrantyExpiry: data.warrantyExpiry
          ? new Date(data.warrantyExpiry)
          : undefined,
        notes: data.notes ?? null,
        renewalAvailable: data.renewalAvailable ?? false,
        renewalNotes: data.renewalNotes ?? null,
        invoiceImage: data.invoiceImage ?? null,
        documents: data.documents
          ? {
              deleteMany: { productId: id },
              create: data.documents.map((doc) => ({
                fileUrl: doc.fileUrl,
                fileType: doc.fileType,
                documentType: doc.documentType,
              })),
            }
          : undefined,
      },
      include: {
        documents: true,
      },
    });

    const nextUrls = new Set([
      updatedProduct.invoiceImage,
      ...updatedProduct.documents.map((doc) => doc.fileUrl),
    ]);

    await deleteUploadedFiles(
      previousUrls.filter((url) => !nextUrls.has(url))
    );

    return jsonSuccess(updatedProduct);
  } catch (error) {
    console.error(error);

    return jsonError("Failed to update product");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const access = await assertProductOwner(id);

    if (access.error || !access.product) {
      return jsonError(access.error, access.status);
    }

    await prisma.product.delete({
      where: { id },
    });

    await deleteUploadedFiles([
      access.product.invoiceImage,
      ...access.product.documents.map((doc) => doc.fileUrl),
    ]);

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error(error);

    return jsonError("Failed to delete product");
  }
}
