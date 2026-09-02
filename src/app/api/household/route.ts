import { z } from "zod";

import { jsonError, jsonSuccess } from "@/lib/api";
import {
  getMembership,
  HouseholdError,
  MAX_HOUSEHOLD_MEMBERS,
  renameHousehold,
} from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";

function householdResponse(error: unknown) {
  if (error instanceof HouseholdError) {
    return jsonError(error.message, error.status);
  }

  console.error("HOUSEHOLD_ERROR", error);
  return jsonError("Something went wrong");
}

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const membership = await getMembership(user.id);

    if (!membership) {
      return jsonSuccess({
        household: null,
        members: [],
        invites: [],
        isOwner: false,
        seats: { used: 0, max: MAX_HOUSEHOLD_MEMBERS },
      });
    }

    const members = membership.household.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    }));

    const invites = membership.household.invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    }));

    return jsonSuccess({
      household: {
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
      },
      members,
      invites,
      isOwner: membership.role === "owner",
      seats: {
        used: members.length + invites.length,
        max: MAX_HOUSEHOLD_MEMBERS,
      },
    });
  } catch (error) {
    return householdResponse(error);
  }
}

const renameSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = renameSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonError("Enter a vault name (max 60 characters)", 400);
    }

    const household = await renameHousehold({
      ownerId: user.id,
      name: parsed.data.name,
    });

    return jsonSuccess({ household: { id: household.id, name: household.name } });
  } catch (error) {
    return householdResponse(error);
  }
}
