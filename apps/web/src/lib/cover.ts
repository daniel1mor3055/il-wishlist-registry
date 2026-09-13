/**
 * The 16:10 teddy shown until a couple pastes their own cover. Stored as
 * null in the registry (no fake URL); the guest hero, OG card and share
 * preview all fall through to this path.
 */
export const DEFAULT_COVER_PATH = "/cover-default.jpg";

export function coverSrc(url: string | null | undefined): string {
  const trimmed = url?.trim();
  return trimmed || DEFAULT_COVER_PATH;
}

export function coverIsCustom(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}
