import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const product =
      await prisma.product.findUnique({
        where: {
          id,
        },

        include: {
          documents: true,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const body = await req.json();

    const { id } = await params;

    const updatedProduct =
      await prisma.product.update({
        where: {
          id,
        },

        data: {
          name: body.name,

          brand: body.brand,

          serialNumber:
            body.serialNumber,

          purchaseDate:
            body.purchaseDate
              ? new Date(
                  body.purchaseDate
                )
              : undefined,

          warrantyExpiry:
            body.warrantyExpiry
              ? new Date(
                  body.warrantyExpiry
                )
              : undefined,

          invoiceImage:
            body.invoiceImage,

          documents: body.documents
            ? {
              deleteMany: {
                productId: id,
              },

                create:
                  body.documents.map(
                    (
                      doc: {
                        fileUrl: string;
                        fileType: string;
                        documentType: string;
                      }
                    ) => ({
                      fileUrl:
                        doc.fileUrl,

                      fileType:
                        doc.fileType,

                      documentType:
                        doc.documentType,
                    })
                  ),
              }
            : undefined,
        },

        include: {
          documents: true,
        },
      });

    return NextResponse.json(
      updatedProduct
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to update product",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to delete product",
      },
      {
        status: 500,
      }
    );
  }
}