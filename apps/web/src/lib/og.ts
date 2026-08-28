/** Open Graph share cards are 1200x630. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/**
 * Cover images are stored at display size, but the share card needs 1200x630 or
 * WhatsApp crops it badly. Both CDNs we serve covers from take the dimensions as
 * query params, so ask for the bigger variant rather than declaring dimensions
 * we are not actually serving.
 *
 * Unknown hosts fall through unchanged, and the caller omits the dimensions.
 */
export function ogImageUrl(url: string): { url: string; resized: boolean } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, resized: false };
  }

  const params = parsed.searchParams;
  const keys =
    params.has("w") || params.has("h")
      ? (["w", "h"] as const)
      : params.has("width") || params.has("height")
        ? (["width", "height"] as const)
        : null;

  if (!keys) return { url, resized: false };

  params.set(keys[0], String(OG_WIDTH));
  params.set(keys[1], String(OG_HEIGHT));
  return { url: parsed.toString(), resized: true };
}
