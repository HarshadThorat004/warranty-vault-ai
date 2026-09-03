import { jsonError, jsonSuccess } from "@/lib/api";
import {
  ensureInboundSlug,
  inboundAddressForSlug,
  listPendingInboundDrafts,
} from "@/lib/inbound";
import { getSessionUser } from "@/lib/product-access";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const slug = await ensureInboundSlug(user.id);
    const drafts = await listPendingInboundDrafts(user.id);

    return jsonSuccess({
      address: inboundAddressForSlug(slug),
      domain: process.env.INBOUND_EMAIL_DOMAIN?.trim() || "inbound.warrantyvault.in",
      drafts: drafts.map((draft) => ({
        id: draft.id,
        fromEmail: draft.fromEmail,
        subject: draft.subject,
        createdAt: draft.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("INBOUND_ADDRESS_ERROR", error);
    return jsonError("Could not load inbound address");
  }
}
