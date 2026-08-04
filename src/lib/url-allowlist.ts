const DEFAULT_ALLOWED_HOSTS = [
  "utfs.io",
  "uploadthing.com",
  "ufs.sh",
];

function normalizeHost(value: string) {
  return value.trim().toLowerCase();
}

function getAllowedHosts() {
  const configured = process.env.ALLOWED_REMOTE_IMAGE_HOSTS
    ?.split(",")
    .map(normalizeHost)
    .filter(Boolean);

  return new Set([
    ...DEFAULT_ALLOWED_HOSTS,
    ...(configured ?? []),
  ]);
}

export function isAllowedRemoteUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return false;
    }

    const host = normalizeHost(url.hostname);

    return getAllowedHosts().has(host);
  } catch {
    return false;
  }
}

export function assertAllowedRemoteUrl(value: string) {
  if (!isAllowedRemoteUrl(value)) {
    throw new Error("Only approved uploaded image URLs are allowed");
  }
}

export function getUploadThingFileKey(value: string) {
  if (!isAllowedRemoteUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);

    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}
