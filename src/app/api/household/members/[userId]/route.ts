import { jsonError, jsonSuccess } from "@/lib/api";
import { HouseholdError, removeHouseholdMember } from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";

type Params = {
  params: Promise<{ userId: string }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { userId } = await params;
    await removeHouseholdMember({
      ownerId: user.id,
      memberUserId: userId,
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    if (error instanceof HouseholdError) {
      return jsonError(error.message, error.status);
    }

    console.error("HOUSEHOLD_REMOVE_MEMBER_ERROR", error);
    return jsonError("Could not remove member");
  }
}
