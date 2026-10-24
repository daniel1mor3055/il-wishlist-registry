"use client";

import { Icon } from "@/components/ui/Sprite";

/** Color classes for a primary pill. Callers still supply their own width and radius. */
export const fillPrimary =
  "bg-brand-deep text-paper shadow-lift-sm hover:bg-brand-hover active:bg-brand-press motion-safe:transition-colors disabled:opacity-30";

export function PrimaryButton({
  children,
  onClick,
  tone = "primary",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "primary" | "success";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`press focus-ring flex h-14 w-full items-center justify-center rounded-pill text-copy font-medium motion-safe:transition-colors disabled:opacity-30 ${
        tone === "success"
          ? "bg-mint-ink text-paper hover:opacity-90 active:opacity-80"
          : fillPrimary
      }`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press focus-ring flex h-14 w-full items-center justify-center rounded-pill bg-cloud text-copy font-medium text-charcoal hover:bg-snow active:bg-hairline motion-safe:transition-colors disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** A quiet text action, used beneath a primary CTA. */
export function TextButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring inline-flex h-11 items-center justify-center text-copy font-medium text-brand-link"
    >
      {children}
    </button>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="חזרה"
      className="press focus-ring grid size-11 place-items-center rounded-full text-brand-deep hover:bg-brand-softer"
    >
      <Icon name="ic-chev-start" className="size-6" />
    </button>
  );
}

/** Actual dismissal. An X is not mirrored. */
export function CloseButton({
  onClick,
  label = "סגירה",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="press focus-ring grid size-11 place-items-center rounded-full bg-paper text-brand-deep shadow-lift-sm hover:bg-brand-softer"
    >
      <Icon name="ic-close" className="size-5" />
    </button>
  );
}
