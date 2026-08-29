import type { NextRequest } from "next/server";
import { apiFetch, passThrough } from "@/lib/bff";
import { ensureGuestId } from "@/lib/guest";

/**
 * Take one unit of an item. The first write a guest ever makes, and therefore
 * the one that mints their cookie.
 *
 * The idempotency key comes from the client, one per tap, so a retry of the
 * same tap replays instead of taking a second unit. A missing key gets one
 * minted here, which is strictly worse - a retry would then be a new attempt -
 * but it keeps a client bug from turning into a failed gift.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const { slug, itemId } = await params;
  const guestId = await ensureGuestId(slug);

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/reservations`,
    {
      method: "POST",
      headers: {
        "X-Guest-Id": guestId,
        "Idempotency-Key": request.headers.get("Idempotency-Key") ?? crypto.randomUUID(),
      },
    },
  );

  return passThrough(upstream);
}
