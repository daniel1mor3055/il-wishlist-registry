import type { PublicRegistry } from "./types";

/**
 * The public read path.
 *
 * Server-only. The browser never learns the API origin; guest writes will go
 * through route handlers under /bff.
 *
 * The default origin is the published port of the api container, which is what
 * `next dev` on the host talks to (D21). Compose overrides it with the internal
 * service name when the web app itself runs in Docker.
 */
const API_ORIGIN = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

export async function getPublicRegistry(slug: string): Promise<PublicRegistry | null> {
  const url = `${API_ORIGIN}/api/v1/public/registries/${encodeURIComponent(slug)}`;

  // Never cached. Claim state changes while guests are on the page, and showing
  // an item as available after someone took it is the one error that costs a
  // duplicate gift.
  const response = await fetch(url, { cache: "no-store" });

  // An unpublished registry answers 404 as well, deliberately (D30).
  if (response.status === 404) return null;

  if (!response.ok) {
    // Deliberately not notFound(): "maybe the link was truncated" would be a
    // lie about a failing API, and the guest would retype a correct link.
    throw new Error(`Registry read failed for ${slug}: HTTP ${response.status}`);
  }

  return (await response.json()) as PublicRegistry;
}
