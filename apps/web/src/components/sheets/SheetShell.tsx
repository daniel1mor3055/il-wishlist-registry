"use client";

import { useEffect } from "react";
import { CloseButton } from "@/components/primitives/Buttons";

function useDismissOnEscape(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
}

/**
 * A bottom sheet.
 *
 * Deviation from PRD section 8, recorded deliberately: the PRD says drawers
 * enter from the right, but a mobile bottom sheet entering from the bottom is
 * the correct platform pattern and is what the reference render does. The
 * right-entry rule applies to side drawers, of which we have none.
 *
 * The header is a three-column grid so the grabber is genuinely centred. The
 * reference used `mx-auto -translate-x-4`, a magic offset compensating for the
 * close button's width, which drifts the moment that button changes size.
 */
export function Sheet({
  children,
  onClose,
  cta,
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  cta?: React.ReactNode;
  labelledBy?: string;
}) {
  useDismissOnEscape(onClose);

  // Fixed, not absolute. The reference could use absolute because it lived
  // inside a fake 390x844 phone frame; on a real page the overlay has to cover
  // the viewport regardless of scroll position. The panel stays constrained to
  // the mobile column so the sheet does not stretch across a desktop window.
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="animate-fade absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-sheet relative mx-auto flex max-h-[85%] w-full max-w-[430px] flex-col rounded-t-[24px] bg-surface"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 pt-3">
          <CloseButton onClick={onClose} />
          <div className="h-1 w-10 justify-self-center rounded-full bg-border" />
          <div className="h-9 w-9" aria-hidden="true" />
        </div>
        <div className="hide-scroll flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {cta && (
          <div className="border-t border-border bg-surface px-5 pb-8 pt-3">{cta}</div>
        )}
      </div>
    </div>
  );
}

/** A centred modal, used for the D12 self-report moment. */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="animate-fade absolute inset-0 bg-black/45" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-fade relative w-full max-w-[382px] rounded-card bg-surface p-6"
      >
        {children}
      </div>
    </div>
  );
}

/** The green check used on confirmation surfaces. A checkmark is not mirrored. */
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
      className={tone === "muted" ? "text-muted" : "text-success"}
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
