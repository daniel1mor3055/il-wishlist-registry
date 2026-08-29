import { apiFetch, passThrough } from "@/lib/bff";

/**
 * The D49 reveal, fetched when the guest asks for the couple's address and not
 * before. No guest cookie: this identifies nobody and changes nothing. It exists
 * as a separate request so the street is absent from the page a link-holder can
 * scrape.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const upstream = await apiFetch(
    `/api/v1/public/registries/${encodeURIComponent(slug)}/shipping-address`,
    { method: "GET" },
  );

  return passThrough(upstream);
}
