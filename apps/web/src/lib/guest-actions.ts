import type {
  ContributionView,
  PaymentHandle,
  ReservationView,
  ShippingAddress,
  WriteResult,
} from "./types";

/**
 * Every guest write, from the browser to our own `/bff` routes.
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

/**
 * Money the guest says they sent. Called after the contact reveal, never
 * before: by the time this runs the transfer has already happened in Bit, so a
 * failure here means the couple's total is wrong about a real gift - which is
 * why the caller retries rather than silently swallowing it.
 */
export async function contribute(
  slug: string,
  itemId: string,
  amountAgorot: number,
): Promise<WriteResult<ContributionView>> {
  try {
    const response = await fetch(
      `${base(slug)}/items/${encodeURIComponent(itemId)}/contributions`,
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amountAgorot }),
      },
    );
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: (await response.json()) as ContributionView };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}

/**
 * The blessing, and with it the name (D36). Attached to whichever gift the
 * guest just made, so the couple's tracker can say who it was from.
 */
export async function sendBlessing(
  slug: string,
  gift: { reservationId?: string | null; contributionId?: string | null },
  giverName: string,
  message: string,
): Promise<WriteResult<null>> {
  try {
    const response = await fetch(`${base(slug)}/blessings`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        giverName: giverName.trim() || null,
        message: message.trim() || null,
        reservationId: gift.reservationId ?? null,
        contributionId: gift.contributionId ?? null,
      }),
    });
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: null };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}

/** The D13 reveal. A read, so it needs no key and no cookie. */
export async function fetchPaymentHandle(
  slug: string,
): Promise<WriteResult<PaymentHandle>> {
  try {
    const response = await fetch(`${base(slug)}/payment-handle`, {
      credentials: "same-origin",
    });
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: (await response.json()) as PaymentHandle };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}

/** The D49 reveal. A read, so it needs no key and no cookie. */
export async function fetchShippingAddress(
  slug: string,
): Promise<WriteResult<ShippingAddress>> {
  try {
    const response = await fetch(`${base(slug)}/shipping-address`, {
      credentials: "same-origin",
    });
    if (!response.ok) return { ok: false, code: await codeFrom(response) };
    return { ok: true, data: (await response.json()) as ShippingAddress };
  } catch {
    return { ok: false, code: NETWORK_FAILED };
  }
}
