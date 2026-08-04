import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: unknown;
};

export function jsonError(
  error: string,
  status = 500,
  extras?: Omit<ApiErrorBody, "error">
) {
  return NextResponse.json(
    {
      error,
      ...extras,
    },
    { status }
  );
}

export function jsonSuccess<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
