import { cookies } from "next/headers";
import { apiFetch } from "@/lib/bff";
import type { OwnerRegistry } from "@/lib/types";

/**
 * The couple's side of the wire.
 *
 * The editor is forms and navigation, so it talks to the API from the server:
 * pages read with `getOwnerRegistry`, mutations are server actions, and there
 * are no `/bff` route handlers for any of it. The guest surface needs its own
 * handlers because its writes happen inside a client component with optimistic
 * state; nothing here does.
 *
 * The session token lives in an `HttpOnly` cookie on this origin and travels to
 * the API as a header, the same split the guest id uses (D31). Client JavaScript
 * never sees it, and the API never sets a cookie.
 *
 * Server-only. Importing this from a client component is a build error.
 */

const COOKIE = "sess";

/** Matches the API's session lifetime, so both ends forget at the same time. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export type OwnerFetch<T> =
  { ok: true; data: T } | { ok: false; status: number; code: string };

/** One request to the API, carrying the session. */
export async function ownerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<OwnerFetch<T>> {
  const token = await readSessionToken();
  if (!token) return { ok: false, status: 401, code: "not_signed_in" };

  const response = await apiFetch(`/api/v1${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
      "X-Session-Token": token,
    },
  });

  if (response.status === 204) return { ok: true, data: undefined as T };
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      code: body?.detail?.code ?? "server_error",
    };
  }
  return { ok: true, data: body as T };
}

/**
 * The editor's read. `null` means "signed in, no list yet", which is the state
 * the create wizard exists for - not an error.
 */
export async function getOwnerRegistry(): Promise<
  { signedIn: false } | { signedIn: true; registry: OwnerRegistry | null }
> {
  const result = await ownerFetch<OwnerRegistry>("/me/registry");
  if (result.ok) return { signedIn: true, registry: result.data };
  if (result.status === 401) return { signedIn: false };
  if (result.status === 404) return { signedIn: true, registry: null };
  return { signedIn: true, registry: null };
}
