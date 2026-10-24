"use client";

import { useId } from "react";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Meter } from "@/components/primitives/Meter";
import { Pill, ShopChip } from "@/components/primitives/Badges";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import { formatAgorot, fundedPercent, remainingAgorot } from "@/lib/money";
import type { PublicItem } from "@/lib/types";

function GroupRemaining({ remaining, total }: { remaining: number; total: number }) {
  const rem = formatAgorot(remaining);
  const tot = formatAgorot(total);
  const [before, rest = ""] = copy.group.remaining("\u0001", "\u0002").split("\u0001");
  const [between, after = ""] = rest.split("\u0002");
  return (
    <>
      <span className="whitespace-nowrap">
        {before}
        <span className="ltr-token">{rem}</span>
      </span>{" "}
      <span className="whitespace-nowrap">
        {between.trim()} <span className="ltr-token">{tot}</span>
        {after}
      </span>
    </>
  );
}

function TilePrice({
  agorot,
  muted,
  featured,
}: {
  agorot: number;
  muted: boolean;
  featured: boolean;
}) {
  return (
    <span
      className={`ltr-token font-medium ${muted ? "text-slate" : "text-graphite"} ${
        featured ? "text-lg lg:text-[28px]" : "text-lg"
      }`}
    >
      {formatAgorot(agorot)}
    </span>
  );
}

function GiftAffordance({ held, featured }: { held: boolean; featured: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ms-auto grid place-items-center rounded-full ${
        held
          ? "bg-brand-deep text-paper"
          : "bg-sticker text-graphite group-hover:bg-brand-deep group-hover:text-paper motion-safe:transition-colors"
      } ${featured ? "size-11 lg:size-14" : "size-9"}`}
    >
      <Icon
        name={held ? "ic-check" : "ic-gift"}
        className={featured ? "size-5 lg:size-7" : "size-[18px]"}
      />
    </span>
  );
}

/**
 * A product tile. The whole tile is the button; the sticker circle is only an
 * affordance. `data-item-id` lets tools/shoot.mjs stage a hold race.
 */
export function ProductCard({
  item,
  onClick,
  featured = false,
  heldByYou = false,
}: {
  item: PublicItem;
  /** Optional so the card can be rendered statically from a server component. */
  onClick?: () => void;
  featured?: boolean;
  /** This guest still holds it. Other guests see `taken` (D35). */
  heldByYou?: boolean;
}) {
  const held = heldByYou && item.claimState !== "purchased";
  const taken = item.claimState !== "available" && !held;
  const remainingQty = item.quantityWanted - item.quantityClaimed;
  const showQty = item.quantityWanted > 1 && remainingQty > 0;
  const isGroup = item.groupGiftEnabled && item.targetAgorot !== null;
  const wide = featured && !isGroup;
  const progressId = useId();

  const layout = wide
    ? "grid w-full grid-cols-[148px_1fr] overflow-hidden rounded-sheet lg:grid-cols-[320px_1fr]"
    : isGroup
      ? "grid h-full w-full grid-cols-[148px_1fr] overflow-hidden rounded-tile lg:flex lg:flex-col"
      : "flex h-full w-full flex-col overflow-hidden rounded-tile";
  const skin = held
    ? "border border-brand-deep bg-paper shadow-lift-sm ring-2 ring-brand-deep"
    : taken
      ? "border border-hairline bg-snow"
      : wide
        ? "border border-hairline bg-paper shadow-lift-sm hover:shadow-lift-md"
        : "border border-hairline bg-paper hover:shadow-lift-sm";
  const motion = taken
    ? ""
    : wide
      ? "motion-safe:transition-colors"
      : "motion-safe:transition motion-safe:active:scale-[.98]";
  const frame = isGroup
    ? "border-e lg:border-b lg:border-e-0"
    : wide
      ? "border-e"
      : "border-b";
  const well = taken ? "bg-cloud" : held ? "bg-brand-softer" : wide ? "bg-snow" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="item-card"
      data-kind={isGroup ? "group" : "product"}
      data-claim={item.claimState}
      data-held-by-you={held ? "true" : undefined}
      data-item-id={item.id}
      className={`focus-ring group text-start ${layout} ${skin} ${motion}`}
    >
      <span className={`relative block aspect-square border-hairline ${frame} ${well} ${wide ? "lg:aspect-[4/5]" : ""}`}>
        <span
          className={`absolute ${wide ? "inset-3 lg:inset-6" : "inset-3"} ${taken ? "opacity-40" : ""} ${
            held ? "mix-blend-multiply" : ""
          } ${
            !taken && !held
              ? "motion-safe:transition-transform motion-safe:duration-100 motion-safe:group-hover:scale-[1.03]"
              : ""
          }`}
        >
          <ItemImage
            src={item.imageUrl}
            alt={item.title}
            category={item.category}
            title={item.title}
            grayscale={taken}
            sizes={
              wide
                ? "(max-width: 1024px) 148px, 320px"
                : isGroup
                  ? "(max-width: 1024px) 148px, 240px"
                  : "(max-width: 1024px) 45vw, 240px"
            }
          />
        </span>
        {held ? (
          <span className="absolute start-2 top-2 inline-flex h-6 items-center gap-1 rounded-[6px] bg-brand-deep px-2 text-badge font-medium text-paper">
            <Icon name="ic-heart" className="size-3.5 fill-current" />
            {copy.item.heldByYou}
          </span>
        ) : taken ? (
          <span className="absolute start-2 top-2">
            <Pill tone="muted">
              <Icon name="ic-lock" className="me-1 size-3.5" />
              {copy.item.taken}
            </Pill>
          </span>
        ) : isGroup ? (
          <span className="absolute start-2 top-2">
            <Pill tone="primary">
              <Icon name="ic-people" className="me-1 size-3.5" />
              {copy.item.groupGiftBadge}
            </Pill>
          </span>
        ) : null}
        {showQty ? (
          <span className="absolute bottom-2 start-2">
            <Pill>{copy.item.quantityRemaining(remainingQty, item.quantityWanted)}</Pill>
          </span>
        ) : null}
      </span>

      <span
        className={
          wide
            ? "flex min-w-0 flex-col justify-center gap-2 p-4 lg:gap-3 lg:p-8"
            : "flex min-w-0 flex-col gap-1 p-3 lg:flex-1"
        }
      >
        <span
          className={
            wide
              ? `clamp-2 text-[15px] font-medium leading-5 lg:text-title ${taken ? "text-slate" : "text-charcoal"}`
              : `clamp-2 min-h-10 text-[15px] leading-5 ${taken ? "text-slate" : "text-charcoal"}`
          }
        >
          {item.title}
        </span>
        {item.chainNameHe ? <ShopChip name={item.chainNameHe} /> : null}
        {isGroup && item.priceAgorot !== null ? (
          <span className="mt-auto self-start pt-1">
            <TilePrice agorot={item.priceAgorot} muted={taken} featured={false} />
          </span>
        ) : null}
        {!isGroup ? (
          <span className={`flex items-center justify-between ${wide ? "mt-2 lg:mt-4" : "mt-auto pt-1"}`}>
            {item.priceAgorot !== null ? (
              <TilePrice agorot={item.priceAgorot} muted={taken} featured={wide} />
            ) : (
              <span />
            )}
            {!taken ? <GiftAffordance held={held} featured={wide} /> : null}
          </span>
        ) : null}
      </span>

      {isGroup && item.targetAgorot !== null ? (
        <span className="col-span-2 block border-t border-hairline px-3 pb-3.5 pt-3 lg:border-t-0 lg:pt-0">
          <Meter
            percent={fundedPercent(item.contributedAgorot, item.targetAgorot)}
            labelledBy={progressId}
          />
          <span
            id={progressId}
            className="mt-2.5 block text-[15px] font-semibold leading-5 text-graphite lg:text-fine"
          >
            <GroupRemaining
              remaining={remainingAgorot(item.contributedAgorot, item.targetAgorot)}
              total={item.targetAgorot}
            />
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-badge text-slate">
            <Icon name="ic-people" className="size-3.5 text-brand-deep" />
            {copy.group.contributors(item.contributorCount)}
          </span>
        </span>
      ) : null}
    </button>
  );
}
