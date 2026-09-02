import { z } from "zod";

import { jsonError, jsonSuccess } from "@/lib/api";
import { acceptHouseholdInvite, HouseholdError } from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";

const acceptSchema = z.object({
  token: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = acceptSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonError("Invalid invite", 400);
    }

    const result = await acceptHouseholdInvite({
      userId: user.id,
      email: user.email,
      token: parsed.data.token,
    });

    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof HouseholdError) {
      return jsonError(error.message, error.status);
    }

    console.error("HOUSEHOLD_ACCEPT_ERROR", error);
    return jsonError("Could not accept invite");
  }
}
