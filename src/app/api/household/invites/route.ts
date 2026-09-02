import { z } from "zod";

import { jsonError, jsonSuccess } from "@/lib/api";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendHouseholdInviteEmail } from "@/lib/email";
import {
  createHouseholdInvite,
  HouseholdError,
} from "@/lib/household";
import { getSessionUser } from "@/lib/product-access";
import { consumeRateLimit } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const limit = consumeRateLimit({
      key: `household:invite:${user.id}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.success) {
      return jsonError("Too many invites. Try again later.", 429);
    }

    const parsed = inviteSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonError("Enter a valid email address", 400);
    }

    const { invite, household, owner, resent } = await createHouseholdInvite({
      ownerId: user.id,
      email: parsed.data.email,
    });

    const acceptUrl = `${getAppBaseUrl()}/invite/${invite.token}`;

    try {
      await sendHouseholdInviteEmail({
        to: invite.email,
        inviterName: owner.name,
        inviterEmail: owner.email,
        householdName: household.name,
        acceptUrl,
      });
    } catch (error) {
      console.error("HOUSEHOLD_INVITE_EMAIL_ERROR", error);
    }

    return jsonSuccess(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          expiresAt: invite.expiresAt.toISOString(),
        },
        resent,
      },
      resent ? 200 : 201
    );
  } catch (error) {
    if (error instanceof HouseholdError) {
      return jsonError(error.message, error.status);
    }

    console.error("HOUSEHOLD_INVITE_ERROR", error);
    return jsonError("Could not send invite");
  }
}
