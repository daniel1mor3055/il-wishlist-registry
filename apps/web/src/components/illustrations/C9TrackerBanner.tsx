import { Icon } from "@/components/ui/Sprite";

export function C9TrackerBanner() {
  return (
    <div
      aria-hidden="true"
      className="relative ms-auto -me-1 mt-1 h-[78px] w-[92px] shrink-0 lg:me-[8%] lg:-mt-2 lg:h-[150px] lg:w-[210px]"
    >
      <span className="absolute end-0 top-0 grid size-14 -rotate-12 place-items-center lg:size-28">
        <svg className="absolute inset-0 size-full fill-sticker drop-shadow-[0_3px_0_color-mix(in_srgb,var(--color-graphite)_18%,transparent)]">
          <use href="#sh-burst" />
        </svg>
        <Icon name="ic-gift" className="relative size-7 text-graphite lg:size-12" />
      </span>
      <span className="absolute bottom-0 start-0 grid size-11 rotate-6 place-items-center rounded-full bg-paper shadow-lift-sm lg:bottom-2 lg:size-20">
        <Icon name="ic-heart" className="size-6 fill-heart-b lg:size-10" />
      </span>
      <span className="absolute bottom-1 end-6 grid size-8 -rotate-6 place-items-center rounded-full bg-mint-wash text-mint-ink shadow-lift-xs lg:bottom-0 lg:end-16 lg:size-14">
        <Icon name="ic-check" className="size-4 text-mint-ink lg:size-7" />
      </span>
    </div>
  );
}
