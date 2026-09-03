import { UTApi } from "uploadthing/server";

import { getUploadThingFileKey } from "@/lib/url-allowlist";

const utapi = new UTApi();

export async function deleteUploadedFiles(urls: Array<string | null | undefined>) {
  const fileKeys = urls
    .map((url) => (url ? getUploadThingFileKey(url) : null))
    .filter((value): value is string => Boolean(value));

  if (fileKeys.length === 0) {
    return;
  }

  try {
    await utapi.deleteFiles(fileKeys);
  } catch (error) {
    console.error("UPLOADTHING_DELETE_ERROR", error);
  }
}

export async function uploadInboundFile(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}) {
  const file = new File([new Uint8Array(input.buffer)], input.filename, {
    type: input.mimeType,
  });
  const result = await utapi.uploadFiles(file);

  if (result.error || !result.data) {
    throw new Error(result.error?.message || "Could not store inbound file");
  }

  return result.data.ufsUrl || result.data.url;
}
