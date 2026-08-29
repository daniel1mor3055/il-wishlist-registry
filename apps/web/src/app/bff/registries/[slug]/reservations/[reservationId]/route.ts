import { apiFetch, noGuestCookie, passThrough } from "@/lib/bff";
import { readGuestId } from "@/lib/guest";

/**
 * The guest hands the unit back - "ביטול" on the handoff sheet.
 *
 * This exists because the hold is placed *before* the guest leaves for the
 * chain. Without it, changing your mind on the way out would freeze the item
 * for everyone else until the couple noticed.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; reservationId: string }> },
) {
  const { slug, reservationId } = await params;
  const guestId = await readGuestId(slug);
  if (!guestId) return noGuestCookie();

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/reservations/${encodeURIComponent(reservationId)}`,
    { method: "DELETE", headers: { "X-Guest-Id": guestId } },
  );

  return passThrough(upstream);
}
