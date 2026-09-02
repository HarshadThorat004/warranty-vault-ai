import { jsonError, jsonSuccess } from "@/lib/api";
import { HouseholdError, leaveHousehold } from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";

export async function POST() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const result = await leaveHousehold(user.id);
    return jsonSuccess(result);
  } catch (error) {
    if (error instanceof HouseholdError) {
      return jsonError(error.message, error.status);
    }

    console.error("HOUSEHOLD_LEAVE_ERROR", error);
    return jsonError("Could not leave household");
  }
}
