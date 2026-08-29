import { NextResponse } from "next/server";
import { apiFetch, passThrough } from "@/lib/bff";
import { readGuestId } from "@/lib/guest";

/**
 * This guest's still-held units, so dismissing G5 can reopen the report
 * instead of looking like someone else took the item.
 *
 * No cookie means they have never written, so there is nothing to list -
 * an empty array, not a 404, because the page asks this on every load.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const guestId = await readGuestId(slug);
  if (!guestId) return NextResponse.json({ holds: [] });

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/holds`,
    { method: "GET", headers: { "X-Guest-Id": guestId } },
  );

  return passThrough(upstream);
}
