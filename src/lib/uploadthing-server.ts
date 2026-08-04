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
