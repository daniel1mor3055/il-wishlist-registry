import type { NextRequest } from "next/server";
import { apiFetch, noGuestCookie, passThrough } from "@/lib/bff";
import { readGuestId } from "@/lib/guest";

/**
 * D12. The guest is back from the chain and says whether they bought it.
 *
 * No cookie means no hold, so there is nothing to report on: the answer is the
 * same not-found the API gives for someone else's reservation id.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; reservationId: string }> },
) {
  const { slug, reservationId } = await params;
  const guestId = await readGuestId(slug);
  if (!guestId) return noGuestCookie();

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/reservations/${encodeURIComponent(reservationId)}/report`,
    {
      method: "POST",
      headers: { "X-Guest-Id": guestId, "content-type": "application/json" },
      body: await request.text(),
    },
  );

  return passThrough(upstream);
}
