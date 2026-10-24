import { useId } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Sprite";
import { G1StepBuy, G1StepChoose, G1StepMark } from "@/components/illustrations/G1HowSteps";
import { copy } from "@/lib/copy";
import { coverIsCustom, coverSrc } from "@/lib/cover";
import type { PublicRegistry } from "@/lib/types";

const RING_C = 207.35;

const HOW_STEPS = [G1StepChoose, G1StepBuy, G1StepMark];

/** Arc fills from the inline-start, counter-clockwise. */
export function ProgressRing({
  percent,
  labelledBy,
  className = "size-[76px] lg:size-24",
  percentClassName = "text-lg font-semibold text-brand-deep lg:text-xl",
}: {
  percent: number;
  labelledBy: string;
  className?: string;
  percentClassName?: string;
}) {
  const gradientId = `ring-${useId().replace(/:/g, "")}`;
  const shown = Math.round(Math.max(0, Math.min(100, percent)));
  const offset = RING_C * (1 - shown / 100);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      role="progressbar"
      aria-valuenow={shown}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-labelledby={labelledBy}
    >
      <svg viewBox="0 0 80 80" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-ring-from)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-ring-to)" }} />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="33" fill="none" className="stroke-hairline" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r="33"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          transform="translate(80 0) scale(-1 1) rotate(-90 40 40)"
        />
      </svg>
      <span aria-hidden="true" className={`ltr-token absolute inset-0 grid place-items-center ${percentClassName}`}>
        {shown}%
      </span>
    </div>
  );
}

/**
 * G1. Server-rendered: this is the first thing a guest sees after tapping a
 * WhatsApp link, so nothing here waits on the client.
 */
export function Hero({
  registry,
  titleAs = "h1",
}: {
  registry: PublicRegistry;
  /** Preview already has the page h1 in the couple bar. */
  titleAs?: "h1" | "p";
}) {
  const progressId = useId();
  const Title = titleAs;
  const percent =
    registry.itemsTotal > 0 ? (registry.itemsClaimed / registry.itemsTotal) * 100 : 0;
  const cover = coverSrc(registry.coverImageUrl);
  const alt = coverIsCustom(registry.coverImageUrl)
    ? `${registry.coupleNames} בבית`
    : copy.hero.defaultCoverAlt;
  const showProgress = registry.itemsTotal > 0;
  const showStory = Boolean(registry.story);

  return (
    <>
      <section className="hero-field relative text-paper">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden fill-paper">
          <Icon name="sh-arch" className="absolute -top-6 -end-16 aspect-[2/1] w-56 opacity-20 lg:top-6 lg:end-[38%] lg:w-72" />
          <Icon name="sh-flower" className="absolute top-44 -start-14 aspect-square w-36 opacity-15 lg:bottom-32 lg:start-[6%] lg:top-auto lg:w-48" />
          <Icon name="sh-triangle" className="absolute top-10 start-6 aspect-[210/176] w-14 opacity-25 lg:top-16 lg:start-[44%] lg:w-20" />
          <Icon name="sh-door" className="absolute bottom-24 -end-8 aspect-[160/193] w-24 opacity-15 lg:bottom-auto lg:top-10 lg:end-[4%] lg:w-36" />
          <Icon name="sh-circle" className="absolute end-5 top-[250px] aspect-square w-10 opacity-25 lg:bottom-48 lg:end-[46%] lg:top-auto lg:w-24 lg:opacity-15" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1392px] flex-col items-center px-5 pb-24 pt-8 text-center lg:grid lg:min-h-[540px] lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:px-12 lg:pb-44 lg:pt-14 lg:text-start">
          <figure className="arrive-photo order-1 lg:order-2 lg:me-[5%]">
            <span className="relative block h-[268px] w-[224px] overflow-hidden rounded-[999px_999px_28px_28px] border-[6px] border-paper bg-paper shadow-lift-md lg:h-[430px] lg:w-[360px] lg:border-8">
              <Image
                src={cover}
                alt={alt}
                fill
                sizes="(max-width: 1024px) 224px, 360px"
                priority
                className="object-cover object-center"
              />
            </span>
          </figure>

          <div className="order-2 mt-7 flex flex-col items-center lg:order-1 lg:mt-0 lg:-translate-y-4 lg:items-start lg:ps-[6%]">
            <div className="relative">
              <span aria-hidden="true" className="hero-scrim pointer-events-none absolute -inset-y-10 -inset-inline-10 lg:hidden" />
              <Title className="relative max-w-[13ch] text-hero font-medium lg:text-hero-wide lg:font-normal">
                {copy.hero.titleFor(registry.coupleNames)}
              </Title>
            </div>
            {registry.city ? (
              <p className="relative mt-4 inline-flex h-8 items-center gap-1.5 rounded-pill bg-paper/92 px-3.5 text-fine font-medium text-graphite shadow-lift-xs">
                <Icon name="ic-pin" className="size-4 text-brand-deep" />
                {registry.city}
              </p>
            ) : null}
            {registry.items.length > 0 ? (
              // Anchor, not a scroll handler: it works before hydration.
              <a
                href="#list"
                className="press focus-ring relative mt-7 inline-flex h-14 items-center justify-center gap-2 rounded-pill bg-paper px-8 text-copy font-medium text-brand-deep shadow-lift-sm hover:bg-brand-softer active:bg-brand-soft lg:h-[60px] lg:px-10 lg:text-lg"
              >
                {copy.hero.cta}
                <Icon name="ic-down" className="size-5" />
              </a>
            ) : null}
          </div>
        </div>

        <Icon name="wave" className="wave-flip pointer-events-none absolute start-0 end-0 bottom-0 h-[40px] w-full fill-paper lg:h-[128px]" />
      </section>

      {showProgress || showStory ? (
        <div className="relative z-10 mx-auto max-w-[1392px] px-4 lg:px-12">
          <div
            className={`arrive-card -mt-14 rounded-sheet bg-paper p-5 shadow-lift-md lg:-mt-28 ${
              showProgress && showStory
                ? "lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10 lg:px-10 lg:py-8"
                : "lg:px-10 lg:py-8"
            }`}
          >
            {showProgress ? (
              <div className="flex items-center gap-4 lg:gap-5">
                <ProgressRing percent={percent} labelledBy={progressId} />
                <p
                  id={progressId}
                  className="text-lead font-medium text-graphite lg:max-w-[12ch] lg:text-title"
                >
                  {copy.hero.progress(registry.itemsClaimed, registry.itemsTotal)}
                </p>
              </div>
            ) : null}
            {showStory ? (
              <div
                className={
                  showProgress
                    ? "mt-4 border-t border-hairline pt-4 lg:mt-0 lg:border-s lg:border-t-0 lg:py-1 lg:ps-10 lg:pt-1"
                    : undefined
                }
              >
                <p className="text-copy leading-[1.65] text-charcoal lg:text-lead">{registry.story}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function HowItWorks({ intoFilter = true }: { intoFilter?: boolean }) {
  return (
    <section aria-labelledby="how-title" className="pastel-field relative mt-10 overflow-hidden lg:mt-14">
      <Icon name="wave" className="pointer-events-none absolute start-0 end-0 top-0 h-[28px] w-full rotate-180 fill-paper lg:h-[72px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
        <Icon name="sh-flower" className="absolute top-10 -start-10 aspect-square w-32 opacity-60 lg:top-16 lg:start-[3%] lg:w-48" />
        <Icon name="sh-arch" className="absolute bottom-16 -end-12 aspect-[2/1] w-44 opacity-50 lg:bottom-20 lg:end-[2%] lg:w-72" />
        <Icon name="sh-triangle" className="absolute top-16 end-8 aspect-[210/176] w-10 opacity-70 lg:end-[22%] lg:top-24 lg:w-14" />
        <Icon name="sh-circle" className="absolute bottom-24 start-[38%] hidden aspect-square w-16 opacity-60 lg:block" />
      </div>
      <div
        className={`relative mx-auto max-w-[1392px] px-5 pt-14 lg:px-12 lg:pt-24 ${
          intoFilter ? "pb-20 lg:pb-32" : "pb-16 lg:pb-24"
        }`}
      >
        <h2 id="how-title" className="text-center text-headline font-medium text-brand-deep lg:text-[36px]">
          {copy.hero.howItWorksTitle}
        </h2>
        <ol className="mx-auto mt-7 grid max-w-[1120px] gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {copy.hero.howItWorks.map((line, index) => {
            const Art = HOW_STEPS[index];
            return (
              <li
                key={line}
                className="flex items-center gap-4 rounded-sheet bg-paper p-4 shadow-lift-sm lg:flex-col lg:gap-5 lg:px-7 lg:py-8 lg:text-center"
              >
                <span className="relative shrink-0" aria-hidden="true">
                  {Art ? <Art /> : null}
                  <span className="ltr-token absolute -top-1.5 -start-1.5 grid size-7 place-items-center rounded-full bg-sticker text-fine font-semibold text-graphite lg:size-8">
                    {index + 1}
                  </span>
                </span>
                <span className="text-copy text-charcoal lg:text-lead">{line}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <Icon
        name="wave"
        className={`wave-flip pointer-events-none absolute start-0 end-0 bottom-0 h-[30px] w-full lg:h-[80px] ${
          intoFilter ? "fill-brand-deep" : "fill-paper"
        }`}
      />
    </section>
  );
}
