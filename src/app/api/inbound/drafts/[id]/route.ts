import { jsonError, jsonSuccess } from "@/lib/api";
import {
  acceptInboundDraft,
  dismissInboundDraft,
  getAccessibleInboundDraft,
  inboundDraftFileUrls,
} from "@/lib/inbound";
import { getSessionUser } from "@/lib/product-access";
import { deleteUploadedFiles } from "@/lib/uploadthing-server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { id } = await params;
    const draft = await getAccessibleInboundDraft(user.id, id);

    if (!draft) {
      return jsonError("Draft not found", 404);
    }

    return jsonSuccess({
      id: draft.id,
      status: draft.status,
      fromEmail: draft.fromEmail,
      subject: draft.subject,
      extracted: draft.extracted,
      files: draft.files,
      createdAt: draft.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("INBOUND_DRAFT_GET_ERROR", error);
    return jsonError("Could not load draft");
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const { id } = await params;
    const body = (await req.json().catch(() => null)) as {
      status?: string;
      productId?: string;
    } | null;

    if (body?.status === "dismissed") {
      const draft = await dismissInboundDraft(user.id, id);
      if (!draft) return jsonError("Draft not found", 404);
      await deleteUploadedFiles(inboundDraftFileUrls(draft.files));
      return jsonSuccess({ success: true });
    }

    if (body?.status === "accepted") {
      const draft = await acceptInboundDraft(user.id, id, body.productId);
      if (!draft) return jsonError("Draft not found", 404);
      return jsonSuccess({ success: true });
    }

    return jsonError("Use status=accepted or status=dismissed", 400);
  } catch (error) {
    console.error("INBOUND_DRAFT_PATCH_ERROR", error);
    return jsonError("Could not update draft");
  }
}
