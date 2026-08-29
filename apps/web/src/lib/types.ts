/**
 * The public read contract.
 *
 * These types mirror the API's `PublicRegistry` and `PublicItem` response
 * models exactly, and are hand-written rather than generated from the OpenAPI
 * schema as the council brief proposed. Codegen would make `tsc` depend on a
 * running API or on a committed schema dump, and the payload is twenty fields
 * that change once per checkpoint. What keeps the two sides honest instead is
 * the golden-key test in `services/api/tests/test_public_read.py`, which
 * asserts the exact key set the API emits.
 *
 * Nothing here may ever carry a giver's identity or a per-guest amount
 * (D8, D15), or a blessing (D17). The payload is server-rendered into the page
 * source, so anything present here is readable by anyone holding the link.
 */

/**
 * Only two states are guest-facing (D29, D30). Unpublished is not one of them:
 * it answers like a wrong slug, so it never reaches this type.
 */
export type Lifecycle = "published" | "closed";

export type ItemKind = "product" | "fund" | "voucher";

export type Category = "linens" | "feeding" | "mobility" | "bath" | "clothing" | "toys";

/** Public claim state. Who claimed it is never public (D8). */
export type ClaimState = "available" | "reserved" | "purchased";

export interface PublicItem {
  id: string;
  kind: ItemKind;
  /** Short display name. Retailer titles run to 100+ chars, so they are shortened. */
  title: string;
  /** The retailer's full title, when it differs. Shown in the detail sheet only. */
  sourceTitle: string | null;
  /** The couple's own note about the item. */
  note: string | null;
  /** Null for the envelope and vouchers, and for a manually added item. */
  category: Category | null;
  imageUrl: string | null;

  /** Product fields. Null for funds and vouchers. */
  chainSlug: string | null;
  chainNameHe: string | null;
  canonicalUrl: string | null;
  priceAgorot: number | null;

  quantityWanted: number;
  quantityClaimed: number;
  claimState: ClaimState;

  /**
   * Group gifting, which only ever applies to a product: the target is that
   * product's real price. The cash envelope has no target at all (D28).
   */
  groupGiftEnabled: boolean;
  targetAgorot: number | null;
  contributedAgorot: number;
  /** A count, never the identities and never the individual amounts (D15). */
  contributorCount: number;

  /** Fund and voucher presentation. */
  subtitle: string | null;
  caption: string | null;
}

export interface PublicRegistry {
  slug: string;
  coupleNames: string;
  story: string;
  coverImageUrl: string | null;
  city: string | null;
  /** ISO date. The expected birth date. */
  dueDate: string | null;
  babyName: string | null;
  lifecycle: Lifecycle;

  itemsTotal: number;
  itemsClaimed: number;

  items: PublicItem[];
}

/**
 * What a guest write answers with: the guest's own hold, plus the item exactly
 * as the read path would now return it. Nothing about anyone else's hold (D8).
 */
export interface ReservationView {
  reservationId: string;
  state: "held" | "purchased" | "released";
  item: PublicItem;
}

/**
 * The same idea for money: the guest's own contribution id, and the item with
 * its new public total. Their own amount is deliberately not echoed back - they
 * just typed it, and no response should be a place to read one from (D15).
 */
export interface ContributionView {
  contributionId: string;
  item: PublicItem;
}

/**
 * Guest writes fail for ordinary reasons - someone else took the last unit -
 * so the failure is a value the caller has to handle, not an exception. The
 * code is an API error code; `errorCopy` turns it into Hebrew.
 */
export type WriteResult<T> = { ok: true; data: T } | { ok: false; code: string };

/**
 * Revealed only on explicit guest interaction (D13), never part of the
 * registry payload. Present here because the same client code consumes it.
 */
export interface PaymentHandle {
  method: "bit" | "paybox";
  handle: string;
  displayName: string;
}
