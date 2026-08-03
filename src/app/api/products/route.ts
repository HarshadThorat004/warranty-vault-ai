import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/product-access";
import { productCreateSchema } from "@/lib/validations/product";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);

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

    const product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand || null,
        serialNumber: data.serialNumber || null,
        purchaseDate: new Date(data.purchaseDate),
        warrantyExpiry: new Date(data.warrantyExpiry),
        notes: data.notes || null,
        renewalAvailable: data.renewalAvailable ?? false,
        renewalNotes: data.renewalNotes || null,
        userId: user.id,
        documents:
          data.documents && data.documents.length > 0
            ? {
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("PRODUCT_CREATE_ERROR", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
