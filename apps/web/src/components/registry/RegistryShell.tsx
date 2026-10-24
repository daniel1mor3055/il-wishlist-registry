import { useId } from "react";
import { Icon } from "@/components/ui/Sprite";
import { ProgressRing } from "@/components/registry/Hero";
import { copy } from "@/lib/copy";
import type { PublicRegistry } from "@/lib/types";

function HeartLogo({ className }: { className: string }) {
  const id = `heart-${useId().replace(/:/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--color-heart-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-heart-b)" }} />
        </linearGradient>
      </defs>
      <use href="#ic-heart" fill={`url(#${id})`} />
    </svg>
  );
}

/** Decorative wordmark. Hidden from AT; the footer says the same words. */
export function GuestBrandBar() {
  return (
    <header className="relative z-40 bg-paper shadow-lift-xs" aria-hidden="true">
      <div className="mx-auto flex h-14 max-w-[1392px] items-center px-5 lg:h-16 lg:px-12">
        <span className="flex items-center gap-2 text-brand-deep">
          <HeartLogo className="size-7" />
          <span className="text-[22px] font-medium">{copy.common.footer}</span>
        </span>
      </div>
    </header>
  );
}

export function GuestFooter({ curve = true }: { curve?: boolean }) {
  return (
    <footer className={curve ? "relative mt-14 bg-brand-deep text-paper lg:mt-24" : "bg-brand-deep text-paper"}>
      {curve ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute start-0 end-0 -top-[28px] h-[30px] w-full fill-brand-deep lg:-top-[60px] lg:h-[62px]"
          viewBox="0 0 1632 160"
          preserveAspectRatio="none"
        >
          <path d="M0 160V70C330 10 760 -12 1100 18c230 20 420 52 532 82v60z" />
        </svg>
      ) : null}
      <div className="mx-auto flex max-w-[1392px] items-center justify-center gap-2 px-5 py-9">
        <Icon name="ic-heart" className="size-6 fill-current text-paper" />
        <p className="text-lg font-medium">{copy.common.footer}</p>
      </div>
    </footer>
  );
}

/**
 * G10. A closed registry is a thank-you, and a missing one looks like a
 * truncated WhatsApp link, which is also unpublished (D30).
 */
export function RegistryShell({
  message,
  messageAs = "p",
  mark,
  children,
}: {
  message: string;
  messageAs?: "h1" | "p";
  mark?: "lock";
  children?: React.ReactNode;
}) {
  const Message = messageAs;
  return (
    <div className="flex min-h-dvh flex-col bg-paper font-rubik text-charcoal antialiased">
      <GuestBrandBar />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-[440px] rounded-sheet bg-brand-soft px-6 py-8 text-center">
          {mark === "lock" ? (
            <span
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-paper text-charcoal shadow-lift-xs"
            >
              <Icon name="ic-lock" className="size-6" />
            </span>
          ) : null}
          <Message className={`${mark === "lock" ? "mt-4 " : ""}text-title font-medium text-graphite`}>
            {message}
          </Message>
          {children}
        </div>
      </main>
      <GuestFooter curve={false} />
    </div>
  );
}

/** A closed registry keeps a summary of what happened, and offers no giving. */
export function ClosedRegistrySummary({
  registry,
  heading = false,
}: {
  registry: PublicRegistry;
  /** Standalone page. Preview already uses the couple bar as the h1. */
  heading?: boolean;
}) {
  const progressId = useId();
  const percent =
    registry.itemsTotal > 0 ? (registry.itemsClaimed / registry.itemsTotal) * 100 : 0;

  return (
    <RegistryShell message={copy.shell.closed} messageAs={heading ? "h1" : "p"}>
      <p className="mt-3 text-lead text-charcoal">{registry.coupleNames}</p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <ProgressRing
          percent={percent}
          labelledBy={progressId}
          className="size-[76px]"
          percentClassName="text-lg font-semibold text-brand-deep"
        />
        <p id={progressId} className="text-start text-lead font-medium text-graphite">
          {copy.hero.progress(registry.itemsClaimed, registry.itemsTotal)}
        </p>
      </div>
    </RegistryShell>
  );
}
