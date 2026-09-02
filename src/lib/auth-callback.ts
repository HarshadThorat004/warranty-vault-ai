const INVITE_PATH = /^\/invite\/[A-Za-z0-9_-]+$/;

export function safeAuthCallbackUrl(raw: string | null | undefined): string {
  if (!raw) {
    return "/dashboard";
  }

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/dashboard";
  }

  const path = raw.split("?")[0]?.split("#")[0] ?? "";

  if (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    INVITE_PATH.test(path)
  ) {
    return path;
  }

  return "/dashboard";
}
