import type { NextRequest } from "next/server";
import { apiFetch, passThrough } from "@/lib/bff";
import { ensureGuestId } from "@/lib/guest";

/**
 * Record money the guest says they sent, toward a group gift or the envelope.
 *
 * `ensureGuestId` rather than `readGuestId`: a guest can send money without
 * ever having reserved anything, so this is a write that mints the cookie.
 *
 * The amount is not validated here. The API bounds it, and a second copy of the
 * rule on this side would be the copy that goes stale.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  const { slug, itemId } = await params;
  const guestId = await ensureGuestId(slug);

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}/contributions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Guest-Id": guestId,
        "Idempotency-Key": request.headers.get("Idempotency-Key") ?? crypto.randomUUID(),
      },
      body: await request.text(),
    },
  );

  return passThrough(upstream);
}
