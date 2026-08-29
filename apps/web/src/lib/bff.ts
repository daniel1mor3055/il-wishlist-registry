import { NextResponse } from "next/server";

/**
 * The browser's only door to the API.
 *
 * Guest writes go through route handlers under `/bff`, so the API origin stays
 * a server-side environment variable and the browser's network tab shows only
 * same-origin requests. That also means the guest cookie is ours: it is set on
 * this origin, `HttpOnly`, and never travels to the API as a cookie - the
 * handler reads it and forwards the value as a header instead.
 *
 * These handlers add nothing else. No validation the API does not already do,
 * no Hebrew, no reshaping: the API's status and body pass straight through, so
 * there is one contract rather than two.
 */

const API_ORIGIN = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_ORIGIN}${path}`, { ...init, cache: "no-store" });
}

/** Mirrors an upstream response, JSON body and status included. */
export async function passThrough(upstream: Response): Promise<NextResponse> {
  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

/** The one error the BFF raises on its own: no cookie means no hold to act on. */
export function noGuestCookie(): NextResponse {
  return NextResponse.json(
    { detail: { code: "reservation_not_found" } },
    { status: 404 },
  );
}
