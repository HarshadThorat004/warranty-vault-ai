import { z } from "zod";

import { collectProductFileUrls, emailsMatch } from "@/lib/account";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  collectAccountDeletionFiles,
  detachUserFromHouseholdForDeletion,
} from "@/lib/household";
import { collectInboundDraftFiles } from "@/lib/inbound";
import { getSessionUser } from "@/lib/product-access";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { deleteUploadedFiles } from "@/lib/uploadthing-server";

const deleteAccountSchema = z.object({
  email: z.string().email(),
});

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const limit = consumeRateLimit({
      key: `account:delete:${user.id}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.success) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    const parsed = deleteAccountSchema.safeParse(await req.json());

    if (!parsed.success || !emailsMatch(parsed.data.email, user.email)) {
      return jsonError("Type your account email to confirm deletion", 400);
    }

    const deletion = await collectAccountDeletionFiles(user.id);
    const inboundUrls = await collectInboundDraftFiles(user.id);
    const fileUrls = [
      ...collectProductFileUrls(deletion.products),
      ...inboundUrls,
    ];

    await detachUserFromHouseholdForDeletion(user.id);

    await prisma.user.delete({
      where: { id: user.id },
    });

    await deleteUploadedFiles(fileUrls);

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("ACCOUNT_DELETE_ERROR", error);
    return jsonError("Failed to delete account");
  }
}
