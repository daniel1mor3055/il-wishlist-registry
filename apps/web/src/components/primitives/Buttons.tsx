"use client";

/** Filled primary control. Charcoal on the pink fill — white on it fails WCAG. */
export const fillPrimary =
  "bg-primary text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-active disabled:opacity-45";

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
      className={`w-full rounded-btn py-3.5 text-body font-medium ${
        tone === "success"
          ? "bg-success text-on-success transition-opacity active:opacity-80 disabled:opacity-45"
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
      className="w-full rounded-btn bg-neutral-tint py-3.5 text-body font-medium text-ink transition-opacity active:opacity-80 disabled:opacity-50"
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
      className="py-1 text-small font-medium text-ink-muted transition-opacity active:opacity-70"
    >
      {children}
    </button>
  );
}

/**
 * Back, not close. PRD section 8: back chevrons point right in RTL.
 * The reference conflated the two, giving a back chevron a "close" label.
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="חזרה"
      className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-neutral-tint"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
      className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-neutral-tint"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
