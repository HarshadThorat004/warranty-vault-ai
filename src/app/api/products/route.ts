import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const {
      name,
      brand,
      purchaseDate,
      warrantyExpiry,
      invoiceImage,
    } = body;

    if (
      !name ||
      !purchaseDate ||
      !warrantyExpiry
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const product =
      await prisma.product.create({
        data: {
          name,

          brand: brand || null,

          purchaseDate: new Date(
            purchaseDate
          ),

          warrantyExpiry: new Date(
            warrantyExpiry
          ),

          invoiceImage:
            invoiceImage || null,

          userId: user.id,
        },
      });

    return NextResponse.json(
      product,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PRODUCT_CREATE_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}