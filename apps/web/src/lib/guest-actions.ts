import type { ReservationView, WriteResult } from "./types";

/**
 * The three guest writes, from the browser to our own `/bff` routes.
 *
 * Losing a race is an ordinary outcome here, not an exception: another guest
 * taking the last unit is the product working. So every call returns a result
 * the caller has to look at, and the error code it carries is what decides
 * which sheet the guest sees next.
 *
 * The guest cookie is `HttpOnly` and lives on this origin, so `credentials:
 * "same-origin"` is the only reason any of this works. None of this code knows
 * the guest's id, and it cannot read it.
 */

const NETWORK_FAILED = "network_failed";

async function codeFrom(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: { code?: string } };
    return body.detail?.code ?? NETWORK_FAILED;
  } catch {
    return NETWORK_FAILED;
  }
}

function base(slug: string): string {
  return `/bff/registries/${encodeURIComponent(slug)}`;
}

export async function reserveItem(
  slug: string,
  itemId: string,
): Promise<WriteResult<ReservationView>> {
  try {
    const response = await fetch(
      `${base(slug)}/items/${encodeURIComponent(itemId)}/reservations`,
      {
        method: "POST",
        credentials: "same-origin",
        // One key per tap. A retry of this tap replays; a new tap is a new
        // attempt. Generated here rather than server-side so that a flaky
        // connection retrying cannot take a second unit.
        headers: { "Idempotency-Key": crypto.randomUUID() },
      },
    );
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: (await response.json()) as ReservationView };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}

export async function reportPurchase(
  slug: string,
  reservationId: string,
  purchased: boolean,
  giverName: string,
): Promise<WriteResult<ReservationView>> {
  try {
    const response = await fetch(
      `${base(slug)}/reservations/${encodeURIComponent(reservationId)}/report`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ purchased, giverName: giverName.trim() || null }),
      },
    );
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: (await response.json()) as ReservationView };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}

export async function releaseReservation(
  slug: string,
  reservationId: string,
): Promise<WriteResult<null>> {
  try {
    const response = await fetch(
      `${base(slug)}/reservations/${encodeURIComponent(reservationId)}`,
      {
        method: "DELETE",
        credentials: "same-origin",
      },
    );
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: null };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}
