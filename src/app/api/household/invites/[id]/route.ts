import { jsonError, jsonSuccess } from "@/lib/api";
import { HouseholdError, revokeInvite } from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { id } = await params;
    await revokeInvite({ ownerId: user.id, inviteId: id });

    return jsonSuccess({ success: true });
  } catch (error) {
    if (error instanceof HouseholdError) {
      return jsonError(error.message, error.status);
    }

    console.error("HOUSEHOLD_REVOKE_INVITE_ERROR", error);
    return jsonError("Could not revoke invite");
  }
}
