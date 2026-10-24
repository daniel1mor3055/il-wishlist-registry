"use client";

import { useEffect } from "react";
import { CloseButton } from "@/components/primitives/Buttons";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";

function useDismissOnEscape(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
}

/** Bottom sheet below `lg`, centred dialog from `lg`. Fixed so it covers the viewport. */
export function Sheet({
  children,
  onClose,
  cta,
  labelledBy,
  wide = false,
  tall = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  cta?: React.ReactNode;
  labelledBy?: string;
  /** 920px desktop dialog. Item detail, handoff, and group gift. */
  wide?: boolean;
  /** Group gift is taller than the other wide sheets. */
  tall?: boolean;
}) {
  useDismissOnEscape(onClose);

  const width = wide
    ? tall
      ? "lg:max-h-[720px] lg:max-w-[920px]"
      : "lg:max-h-[680px] lg:max-w-[920px]"
    : "lg:max-w-[640px]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-10">
      <div
        className="sheet-scrim absolute inset-0 bg-graphite/55"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`sheet-panel relative flex max-h-[92dvh] min-h-0 w-full flex-col overflow-hidden rounded-t-sheet bg-paper shadow-lift-lg lg:rounded-sheet ${width}`}
      >
        <span aria-hidden="true" className="band-field absolute inset-x-0 top-0 z-20 h-1.5" />
        <div className="absolute top-4 end-3 z-20 lg:top-5 lg:end-5">
          <CloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-auto overflow-y-auto">{children}</div>
        {cta ? <div className="shrink-0">{cta}</div> : null}
      </div>
    </div>
  );
}

/** Centred on every width. Scrim and Escape both dismiss; on the report that keeps the hold (D35). */
export function Modal({
  children,
  onClose,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy?: string;
}) {
  useDismissOnEscape(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10">
      <div
        className="sheet-scrim absolute inset-0 bg-graphite/55"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="sheet-panel relative w-full max-w-[440px] rounded-sheet bg-paper p-5 shadow-lift-lg"
      >
        <span
          aria-hidden="true"
          className="band-field absolute inset-x-0 top-0 h-1.5 rounded-t-sheet"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.common.close}
          className="press focus-ring absolute top-4 end-3 grid size-11 place-items-center rounded-full text-brand-deep hover:bg-brand-softer motion-safe:transition-colors"
        >
          <Icon name="ic-close" className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

/** Not mirrored in RTL. */
export function CheckMark({
  size = 24,
  tone = "success",
}: {
  size?: number;
  tone?: "success" | "muted";
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={tone === "muted" ? "text-slate" : "text-mint-ink"}
      aria-hidden="true"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
