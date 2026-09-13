import Image from "next/image";
import { Meter } from "@/components/primitives/Meter";
import { copy } from "@/lib/copy";
import { coverIsCustom, coverSrc } from "@/lib/cover";
import type { PublicRegistry } from "@/lib/types";

/**
 * G1. Server-rendered: this is the first thing a guest sees after tapping a
 * WhatsApp link, so nothing here waits on the client.
 */
export function Hero({ registry }: { registry: PublicRegistry }) {
  const percent =
    registry.itemsTotal > 0 ? (registry.itemsClaimed / registry.itemsTotal) * 100 : 0;
  const cover = coverSrc(registry.coverImageUrl);
  const alt = coverIsCustom(registry.coverImageUrl)
    ? `${registry.coupleNames} בבית`
    : copy.hero.defaultCoverAlt;

  return (
    <>
      <div className="relative aspect-[16/10] w-full bg-image-bg">
        <Image
          src={cover}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="flex flex-col gap-4 px-5 pt-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-bold text-ink">
            {copy.hero.titleFor(registry.coupleNames)}
          </h1>
          <p className="text-body text-ink">{registry.story}</p>
          {registry.city && (
            <p className="text-small text-ink-muted">{registry.city}</p>
          )}
        </div>

        {registry.itemsTotal > 0 && (
          <div className="flex flex-col gap-1.5">
            <Meter percent={percent} />
            <p className="text-small text-ink-muted">
              {copy.hero.progress(registry.itemsClaimed, registry.itemsTotal)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export function HowItWorks() {
  return (
    <div className="mx-5 mt-4 flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-h3 font-bold text-ink">{copy.hero.howItWorksTitle}</h2>
      {copy.hero.howItWorks.map((line, index) => (
        <div key={line} className="flex items-start gap-3">
          <span className="ltr-token grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-small font-bold text-on-accent">
            {index + 1}
          </span>
          <p className="text-small text-ink">{line}</p>
        </div>
      ))}
    </div>
  );
}
