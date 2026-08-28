import { ALL_REGISTRIES } from "./fixtures/registries";
import type { PublicRegistry } from "./types";

/**
 * The public read path.
 *
 * At C1 this resolves from fixtures, because there is no database yet. At C2
 * the body becomes a fetch of `GET /api/v1/public/registries/{slug}` against
 * `API_INTERNAL_URL`, and nothing above this function changes - that is the
 * whole reason the fixtures are typed as the API contract.
 *
 * Server-only. The browser never learns the API origin; guest writes go through
 * route handlers under /bff.
 */
export async function getPublicRegistry(slug: string): Promise<PublicRegistry | null> {
  return ALL_REGISTRIES[slug] ?? null;
}

/** Slugs available in the C1 fixture set, for the dev index and the gallery. */
export function listFixtureSlugs(): string[] {
  return Object.keys(ALL_REGISTRIES);
}
