import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/bff";
import { setSessionToken } from "@/lib/owner";

/**
 * Where the magic link lands.
 *
 * A route handler rather than a page, because following the link sets a cookie
 * and Next only allows that in a handler or a server action. It also keeps the
 * exchange off the rendering path entirely: this endpoint does one thing and
 * then redirects.
 *
 * A state-changing GET, which is normally wrong. Here the request *is* a human
 * following a mailed link, and the alternative - a page with a "finish signing
 * in" button - asks them to prove they meant it. What makes it survivable is
 * that the token is single-use and expires in twenty minutes: a mail client
 * prefetching the link spends the token and the human then lands on the form,
 * which is a bad outcome but not a dangerous one.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get("token");
  const dead = NextResponse.redirect(new URL("/editor/enter?dead=1", request.url));
  if (!token) return dead;

  const response = await apiFetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) return dead;

  const body = await response.json();
  await setSessionToken(body.sessionToken);

  // A couple with no list has nothing to look at in the editor, so the wizard is
  // the honest destination for a first login.
  return NextResponse.redirect(
    new URL(body.hasRegistry ? "/editor" : "/editor/new", request.url),
  );
}
