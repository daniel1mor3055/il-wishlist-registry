"use client";

import { InlineAmount } from "@/components/primitives/Price";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import type { PublicItem } from "@/lib/types";

/** Cash strip. No meter and no target: an envelope is not a fund (D28). */
export function MoneyCard({
  item,
  hasBit = false,
  hasPaybox = false,
  onClick,
  prominent = false,
}: {
  item: PublicItem;
  hasBit?: boolean;
  hasPaybox?: boolean;
  /** Optional so the card can be rendered statically from a server component. */
  onClick?: () => void;
  /** Every product is taken, so the envelope is the way left to give. */
  prominent?: boolean;
}) {
  const collected = item.contributorCount > 0;
  const title = copy.fund.tile(hasBit, hasPaybox);

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="item-card"
      data-kind={item.kind}
      className={
        prominent
          ? "focus-ring group relative grid min-h-[112px] w-full grid-cols-[64px_1fr_20px] items-center gap-x-4 overflow-hidden rounded-sheet border-2 border-brand-soft bg-page-sand px-4 py-4 text-start shadow-lift-sm lg:min-h-[128px] lg:grid-cols-[72px_1fr_auto_20px] lg:gap-6 lg:px-6"
          : "focus-ring group relative grid min-h-[88px] w-full grid-cols-[56px_1fr_20px] items-center gap-x-4 overflow-hidden rounded-tile border border-hairline bg-page-sand px-4 py-3.5 text-start hover:border-hairline-strong motion-safe:transition motion-safe:active:scale-[.99] lg:flex lg:min-h-[104px] lg:gap-6 lg:px-6"
      }
    >
      {prominent ? null : (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden fill-shape-ink lg:block">
          <Icon name="sh-arch" className="absolute -top-10 start-[40%] aspect-[2/1] w-40 fill-shape-ink opacity-[.06]" />
          <Icon name="sh-flower" className="absolute -bottom-16 start-[56%] aspect-square w-28 fill-shape-ink opacity-[.05]" />
          <Icon name="sh-triangle" className="absolute top-4 start-[70%] aspect-[210/176] w-8 fill-shape-ink opacity-[.07]" />
        </span>
      )}
      <span
        aria-hidden="true"
        className={`pastel-field relative row-span-2 grid shrink-0 place-items-center rounded-full ${
          prominent ? "size-16 lg:size-[72px]" : "size-14 lg:size-16"
        }`}
      >
        <Icon
          name="ic-heart"
          className={`fill-current text-brand-deep ${prominent ? "size-8" : "size-7"}`}
        />
      </span>
      <span className="relative min-w-0 lg:flex-1">
        <span className={`block font-medium text-charcoal ${prominent ? "text-lead" : "text-copy lg:text-lead"}`}>
          {title}
        </span>
        {item.subtitle ? <span className="block text-fine text-slate">{item.subtitle}</span> : null}
        {item.caption ? <span className="block text-fine text-slate">{item.caption}</span> : null}
      </span>
      {collected ? (
        <span
          className={
            prominent
              ? "relative col-start-2 mt-1 flex flex-wrap items-baseline gap-x-3 text-fine lg:col-start-3 lg:mt-0 lg:flex-col lg:items-end"
              : "relative col-start-2 mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-badge lg:mt-0 lg:flex-col lg:items-end lg:gap-0.5 lg:text-end"
          }
        >
          <span className={`font-medium text-charcoal ${prominent ? "" : "lg:text-copy"}`}>
            {copy.fund.collected} <InlineAmount agorot={item.contributedAgorot} />
          </span>
          <span className={`text-slate ${prominent ? "" : "lg:text-fine"}`}>
            {copy.group.contributors(item.contributorCount)}
          </span>
        </span>
      ) : null}
      <Icon
        name="ic-chev-end"
        className={`relative col-start-3 row-span-2 row-start-1 size-5 shrink-0 text-slate ${
          prominent ? "lg:col-start-4" : ""
        }`}
      />
    </button>
  );
}
