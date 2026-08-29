import { apiFetch, passThrough } from "@/lib/bff";

/**
 * The D13 reveal, fetched when the guest opens the contact sheet and not before.
 *
 * No guest cookie: this identifies nobody and changes nothing. It exists as a
 * separate request precisely so the couple's Bit number is absent from the page
 * a link-holder can read or scrape.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/payment-handle`,
    { method: "GET" },
  );

  return passThrough(upstream);
}
