import { cookies } from "next/headers";

/**
 * Guest identity, such as it is.
 *
 * A guest never signs in (D7). What identifies them is an `HttpOnly` cookie
 * this file mints on their first write, and it is deliberately *per registry*:
 * two links from two different couples produce two unrelated ids, so nothing
 * here can be used to follow someone between registries.
 *
 * The value is the whole capability. Presenting it is what lets a guest report
 * or release their own hold, and it never reaches client JavaScript - the
 * cookie is `HttpOnly` and only the route handlers under `/bff` read it.
 *
 * Server-only. Importing this from a client component is a build error, which
 * is the point.
 */

const PREFIX = "gst_";

/** Half a year. Long enough that a returning guest is still themselves. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cookieName(slug: string): string {
  return `${PREFIX}${slug}`;
}

export async function readGuestId(slug: string): Promise<string | null> {
  const store = await cookies();
  const value = store.get(cookieName(slug))?.value;
  return value && UUID.test(value) ? value : null;
}

/** Reads the guest's id, minting and setting one if this is their first write. */
export async function ensureGuestId(slug: string): Promise<string> {
  const existing = await readGuestId(slug);
  if (existing) return existing;

  const guestId = crypto.randomUUID();
  const store = await cookies();
  store.set(cookieName(slug), guestId, {
    httpOnly: true,
    sameSite: "lax",
    // The registry page is a link people follow, so `strict` would drop the
    // cookie on the first navigation from WhatsApp.
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return guestId;
}
