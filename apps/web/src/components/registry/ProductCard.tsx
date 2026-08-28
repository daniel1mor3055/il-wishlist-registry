"use client";

import { ItemImage } from "@/components/primitives/ItemImage";
import { Meter } from "@/components/primitives/Meter";
import { Pill, PriorityBadge, ShopChip } from "@/components/primitives/Badges";
import { Price, InlineAmount } from "@/components/primitives/Price";
import { copy } from "@/lib/copy";
import { fundedPercent, remainingAgorot } from "@/lib/money";
import type { PublicItem } from "@/lib/types";

/**
 * A product tile.
 *
 * Card interior follows PRD section 8: text right-aligned, chips at the inline
 * start, price at the inline end. The badge overlay uses `start-2`, not the
 * reference's physical `right-2`.
 */
export function ProductCard({
  item,
  onClick,
  featured = false,
}: {
  item: PublicItem;
  /** Optional so the card can be rendered statically from a server component. */
  onClick?: () => void;
  featured?: boolean;
}) {
  const taken = item.claimState !== "available";
  const remainingQty = item.quantityWanted - item.quantityClaimed;
  const showQty = item.quantityWanted > 1 && remainingQty > 0;
  const isGroup = item.groupGiftEnabled && item.targetAgorot !== null;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="item-card"
      data-kind={isGroup ? "group" : "product"}
      data-claim={item.claimState}
      className={`flex flex-col overflow-hidden rounded-card border border-border bg-surface text-right transition-transform active:scale-[0.98] ${
        taken ? "opacity-70" : ""
      } ${featured ? "col-span-2" : ""}`}
    >
      <div
        className={`relative w-full bg-image-bg ${featured ? "aspect-[16/10]" : "aspect-square"}`}
      >
        <ItemImage
          src={item.imageUrl}
          alt={item.title}
          category={item.category}
          title={item.title}
          grayscale={taken}
          sizes={
            featured
              ? "(max-width: 640px) 100vw, 480px"
              : "(max-width: 640px) 50vw, 240px"
          }
        />
        {taken ? (
          <span className="absolute start-2 top-2">
            <Pill tone="muted">{copy.item.taken}</Pill>
          </span>
        ) : isGroup ? (
          <span className="absolute start-2 top-2">
            <Pill tone="primary">{copy.item.groupGiftBadge}</Pill>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Reserved min-height: Hebrew does not hyphenate, so the grid uses a
            two-line clamp with fixed height rather than a single-line ellipsis. */}
        <p
          className={`line-clamp-2 min-h-[48px] text-small font-medium ${
            taken ? "text-muted" : "text-ink"
          }`}
        >
          {item.title}
        </p>

        {showQty && (
          <Pill>{copy.item.quantityRemaining(remainingQty, item.quantityWanted)}</Pill>
        )}

        {!item.inStock && !taken && item.chainNameHe && (
          <Pill>{copy.item.outOfStock(item.chainNameHe)}</Pill>
        )}

        {isGroup && (
          <div className="flex flex-col gap-1.5">
            <Meter percent={fundedPercent(item.contributedAgorot, item.targetAgorot)} />
            <p className="text-tiny font-medium text-ink">
              נותרו{" "}
              <InlineAmount
                agorot={remainingAgorot(item.contributedAgorot, item.targetAgorot)}
              />{" "}
              מתוך <InlineAmount agorot={item.targetAgorot!} />
            </p>
            <p className="text-micro text-ink-muted">
              {copy.group.contributors(item.contributorCount)}
            </p>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-wrap justify-start gap-1.5">
            {item.chainNameHe && <ShopChip name={item.chainNameHe} />}
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
          {item.priceAgorot !== null && <Price agorot={item.priceAgorot} muted={taken} />}
        </div>
      </div>
    </button>
  );
}
