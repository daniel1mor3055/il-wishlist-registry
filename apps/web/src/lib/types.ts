/**
 * The public read contract.
 *
 * These types mirror the API's `PublicRegistry` and `PublicItem` response
 * models exactly. At C1 they are satisfied by fixtures; at C2 they are
 * generated from the FastAPI OpenAPI schema and these hand-written versions
 * are deleted, so C2 replaces a loader rather than a data model.
 *
 * Nothing here may ever carry a giver's identity or a per-guest amount
 * (D8, D15), or a blessing (D17). The payload is server-rendered into the page
 * source, so anything present here is readable by anyone holding the link.
 */

export type Lifecycle = "draft" | "published" | "post_birth" | "closed";

export type ItemKind = "product" | "fund" | "voucher";

/** PRD G3: חובה / רצוי / נחמד שיהיה */
export type Priority = "must" | "want" | "nice";

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
  category: Category;
  imageUrl: string | null;

  priority: Priority | null;

  /** Product fields. Null for funds and vouchers. */
  chainSlug: string | null;
  chainNameHe: string | null;
  canonicalUrl: string | null;
  priceAgorot: number | null;
  inStock: boolean;

  quantityWanted: number;
  quantityClaimed: number;
  claimState: ClaimState;

  /** Group gift and fund fields. */
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
  /** ISO date, set once the couple flips to post-birth. */
  bornOn: string | null;
  lifecycle: Lifecycle;

  itemsTotal: number;
  itemsClaimed: number;

  items: PublicItem[];
}

/**
 * Revealed only on explicit guest interaction (D13), never part of the
 * registry payload. Present here because the same client code consumes it.
 */
export interface PaymentHandle {
  method: "bit" | "paybox";
  handle: string;
  displayName: string;
}
