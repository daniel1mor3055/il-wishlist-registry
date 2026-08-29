import type { NextRequest } from "next/server";
import { apiFetch, passThrough } from "@/lib/bff";
import { ensureGuestId } from "@/lib/guest";

/**
 * A private message to the couple (D17), and the one place a guest's name is
 * recorded (D36).
 *
 * The API answers 201 with no body and there is no GET here, because a blessing
 * has no reader other than the couple.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const guestId = await ensureGuestId(slug);

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/blessings`,
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
