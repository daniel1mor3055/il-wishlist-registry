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
 * Nothing in the public types may ever carry a giver's identity or a per-guest
 * amount (D8, D15), or a blessing (D17). That payload is server-rendered into
 * the page source, so anything on it is readable by anyone holding the link.
 */

/**
 * Only two states are guest-facing (D29, D30). Unpublished is not one of them:
 * it answers like a wrong slug, so it never reaches this type.
 */
export type Lifecycle = "published" | "closed";

export type ItemKind = "product" | "fund";

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
  /** Null for the envelope, and for a manually added item. */
  category: Category | null;
  imageUrl: string | null;

  /** Product fields. Null for funds. */
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

  /** Fund presentation. */
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
  /** Palette for the guest page. Null is "not known yet" (theme `unset`). */
  babyGender: "boy" | "girl" | null;
  lifecycle: Lifecycle;

  itemsTotal: number;
  itemsClaimed: number;

  /**
   * Presence only (D49). The street itself is a separate GET, like the
   * payment rails, so the page source cannot name where the couple lives.
   */
  hasShippingAddress: boolean;
  /** Presence only (D13). The numbers themselves are a separate GET. */
  hasBit: boolean;
  hasPaybox: boolean;

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
 * This guest's still-open holds. A reservation id is a capability, so this
 * never lives on `PublicRegistry` - only the cookie-backed read.
 */
export interface MyHolds {
  holds: { itemId: string; reservationId: string }[];
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

export interface PaymentRail {
  method: "bit" | "paybox";
  handle: string;
  displayName: string;
}

/**
 * Revealed only on explicit guest interaction (D13), never part of the
 * registry payload. Present here because the same client code consumes it.
 */
export interface PaymentHandle {
  rails: PaymentRail[];
}

/**
 * Revealed only when a guest on the product handoff asks (D49). Same split as
 * the payment rails: never part of the registry payload.
 */
export interface ShippingAddress {
  recipientName: string;
  street: string;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  copyText: string;
}

/* ---------- the couple's own view ---------- */

/**
 * The mirror of the public types: everything above is what a guest may see, and
 * these carry what only the couple may. They reach the browser exclusively
 * through server components under `/editor`, never through `/bff`.
 *
 * Giver names are not on the registry. They are on the tracker types below,
 * and only `/editor/tracker` may pass them to a client component.
 */
export interface OwnerItem {
  id: string;
  position: number;
  kind: ItemKind;

  title: string;
  sourceTitle: string | null;
  note: string | null;
  category: Category | null;
  imageUrl: string | null;
  subtitle: string | null;
  caption: string | null;

  chainSlug: string | null;
  chainNameHe: string | null;
  canonicalUrl: string | null;
  priceAgorot: number | null;

  quantityWanted: number;
  quantityClaimed: number;
  claimState: ClaimState;

  groupGiftEnabled: boolean;
  targetAgorot: number | null;
  contributedAgorot: number;
  contributorCount: number;

  /** Hidden from guests without being deleted, so history survives a removal. */
  isActive: boolean;
}

export interface OwnerRegistry {
  id: string;
  slug: string;
  coupleNames: string;
  story: string;
  coverImageUrl: string | null;
  city: string | null;
  dueDate: string | null;
  babyName: string | null;
  babyGender: "boy" | "girl" | null;

  shippingStreet: string | null;
  shippingEntrance: string | null;
  shippingFloor: string | null;
  shippingApartment: string | null;
  shippingNotes: string | null;
  shippingPostalCode: string | null;

  /** Null means guests get "not found" on the link, including the couple (D30). */
  publishedAt: string | null;
  closedAt: string | null;

  bitHandle: string | null;
  payboxHandle: string | null;
  paymentDisplayName: string | null;

  itemsTotal: number;
  itemsClaimed: number;
  items: OwnerItem[];
}

/** GET /me/registry/gifts. Giver names live only here (D52); no thanked flag (D55). */
export interface TrackerItem {
  id: string;
  title: string;
  kind: ItemKind;
  imageUrl: string | null;
  category: Category | null;
  isActive: boolean;
}

export interface TrackerReservation {
  id: string;
  item: TrackerItem;
  state: "held" | "purchased";
  giverName: string | null;
  createdAt: string;
  reportedAt: string | null;
  resolvedBy: "guest" | "couple" | null;
  blessing: string | null;
}

export interface TrackerContribution {
  id: string;
  item: TrackerItem;
  giverName: string | null;
  amountAgorot: number;
  createdAt: string;
  blessing: string | null;
}

export interface TrackerBlessing {
  id: string;
  giverName: string | null;
  message: string;
  createdAt: string;
  item: TrackerItem | null;
}

export interface GiftTracker {
  /** Oldest first. */
  held: TrackerReservation[];
  purchased: TrackerReservation[];
  contributions: TrackerContribution[];
  blessings: TrackerBlessing[];
}

/** One row of catalog search, as the add-item screen renders it. */
export interface CatalogResult {
  id: string;
  title: string;
  sourceTitle: string | null;
  category: Category;
  priceAgorot: number;
  imageUrl: string;
  canonicalUrl: string;
  chainSlug: string;
  chainNameHe: string;
}

export interface CatalogPage {
  results: CatalogResult[];
  /** All matches, not just this page, so the screen can say there are more. */
  total: number;
}

/** POST /catalog/resolve. needsVariant has no single price; the couple picks one (D60). */
export type CatalogResolveReason =
  | "unknown_host"
  | "not_product"
  | "not_https"
  | "fetch_failed"
  | "bad_document"
  | "missing_price";

export interface CatalogResolveVariant {
  id: string;
  label: string;
  priceAgorot: number;
  imageUrl: string | null;
}

export interface CatalogResolvedProduct {
  outcome: "product";
  chainSlug: string;
  chainNameHe: string;
  title: string;
  imageUrl: string | null;
  priceAgorot: number;
  canonicalUrl: string;
  /** Null when every variant shares one price and no pick is required (D60). */
  variantId: string | null;
  category: Category | null;
}

export interface CatalogResolvedNeedsVariant {
  outcome: "needsVariant";
  chainSlug: string;
  chainNameHe: string;
  title: string;
  imageUrl: string | null;
  canonicalUrl: string;
  category: Category | null;
  variants: CatalogResolveVariant[];
}

export interface CatalogResolvedUnresolved {
  outcome: "unresolved";
  reason: CatalogResolveReason;
  url: string;
}

export type CatalogResolve =
  | CatalogResolvedProduct
  | CatalogResolvedNeedsVariant
  | CatalogResolvedUnresolved;
