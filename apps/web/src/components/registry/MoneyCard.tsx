"use client";

import { InlineAmount } from "@/components/primitives/Price";
import { copy } from "@/lib/copy";
import type { PublicItem } from "@/lib/types";

/**
 * The envelope illustration for cash funds. A gift or envelope glyph is not
 * mirrored in RTL (PRD section 8).
 */
export function EnvelopeArt() {
  return (
    <div className="grid aspect-square w-full place-items-center rounded-btn bg-accent-tint">
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect
          x="8"
          y="16"
          width="48"
          height="34"
          rx="5"
          className="fill-surface stroke-accent"
          strokeWidth="2.5"
        />
        <path
          d="M10 20l22 16 22-16"
          className="stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 30v10M27 35h10"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * The cash envelope, or a voucher tile.
 *
 * Dashed border so the money tile reads as a different kind of object from a
 * product, and deliberately quieter: PRD risk 3 is that cash cannibalises
 * products, so the product tile has to be the more attractive object.
 *
 * It shows what has been given so far and by how many guests, but no meter and
 * no remaining amount: an envelope is not a fund with a target (D28), so there
 * is no "מתוך" to show. Collecting toward a specific thing is what group
 * gifting on a real product is for, and that lives on `ProductCard`.
 *
 * Nothing is shown until the first guest gives. An envelope announcing ₪0 asks
 * the first person to go first, which is the opposite of what the line is for.
 */
export function MoneyCard({
  item,
  onClick,
}: {
  item: PublicItem;
  /** Optional so the card can be rendered statically from a server component. */
  onClick?: () => void;
}) {
  const collected = item.kind === "fund" && item.contributorCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="item-card"
      data-kind={item.kind === "voucher" ? "voucher" : "fund"}
      className="flex flex-col gap-2.5 rounded-card border border-dashed border-border bg-surface p-3 text-right transition-transform active:scale-[0.98]"
    >
      <EnvelopeArt />
      <p className="text-body font-bold text-ink">{item.title}</p>
      {item.subtitle && <p className="text-tiny text-ink-muted">{item.subtitle}</p>}
      {item.caption && <p className="text-tiny text-ink-muted">{item.caption}</p>}

      {collected && (
        <div className="flex flex-col gap-1">
          <p className="text-tiny font-medium text-ink">
            {copy.fund.collected} <InlineAmount agorot={item.contributedAgorot} />
          </p>
          <p className="text-micro text-ink-muted">
            {copy.group.contributors(item.contributorCount)}
          </p>
        </div>
      )}
    </button>
  );
}
