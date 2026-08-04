import { jsonError, jsonSuccess } from "@/lib/api";
import { listProductsForUser, parseProductListParams } from "@/lib/products-query";
import { getSessionUser } from "@/lib/product-access";
import { prisma } from "@/lib/prisma";
import { productCreateSchema } from "@/lib/validations/product";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const url = new URL(req.url);
    const products = await listProductsForUser(
      user.id,
      parseProductListParams(url.searchParams)
    );

    return jsonSuccess(products);
  } catch (error) {
    console.error("PRODUCT_LIST_ERROR", error);
    return jsonError("Failed to load products");
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Validation failed", 400, {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand || null,
        serialNumber: data.serialNumber || null,
        purchaseDate: new Date(data.purchaseDate),
        warrantyExpiry: new Date(data.warrantyExpiry),
        invoiceImage: data.invoiceImage || null,
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

    return jsonSuccess(product, 201);
  } catch (error) {
    console.error("PRODUCT_CREATE_ERROR", error);
    return jsonError("Something went wrong");
  }
}
