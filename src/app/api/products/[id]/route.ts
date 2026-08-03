import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { assertProductOwner } from "@/lib/product-access";
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
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    return NextResponse.json(access.product);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand ?? null,
        serialNumber: data.serialNumber ?? null,
        purchaseDate: data.purchaseDate
          ? new Date(data.purchaseDate)
          : undefined,
        warrantyExpiry: data.warrantyExpiry
          ? new Date(data.warrantyExpiry)
          : undefined,
        notes: data.notes ?? null,
        renewalAvailable: data.renewalAvailable ?? false,
        renewalNotes: data.renewalNotes ?? null,
        invoiceImage: data.invoiceImage,
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

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
