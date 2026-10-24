import Link from "next/link";

function buttonClass({
  variant,
  size,
  fit,
  pending,
  disabled,
}: {
  variant: "primary" | "secondary" | "quiet" | "danger";
  size: "md" | "sm";
  fit: boolean;
  pending: boolean;
  disabled: boolean;
}) {
  const quiet = variant === "quiet";
  const shape = quiet
    ? size === "sm"
      ? "inline-flex h-9 items-center gap-2 text-fine font-medium"
      : "inline-flex h-11 items-center gap-2 text-copy font-medium"
    : size === "sm"
      ? "flex h-11 w-full items-center justify-center gap-2 rounded-pill text-fine font-medium"
      : "flex h-14 w-full items-center justify-center gap-2 rounded-pill text-copy font-medium";
  const tone = {
    primary:
      "bg-brand-deep text-paper shadow-lift-sm hover:bg-brand-hover active:bg-brand-press",
    secondary: "bg-cloud text-charcoal hover:bg-snow active:bg-hairline",
    quiet: "text-brand-link",
    danger: "bg-alert text-paper hover:bg-alert-hover active:bg-alert-press",
  }[variant];
  const fitClass = fit && !quiet ? " lg:w-auto lg:min-w-[260px] lg:px-10" : "";
  const blocked = disabled || pending;
  const faded = disabled && !pending ? " opacity-30" : "";
  const interactive = blocked ? "" : " press focus-ring motion-safe:transition-colors";
  return shape + " " + tone + fitClass + interactive + faded;
}

export function Button({
  children,
  type = "submit",
  disabled = false,
  pending = false,
  onClick,
  fit = false,
  variant = "primary",
  href,
  size = "md",
  ariaLabel,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
  fit?: boolean;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  href?: string;
  size?: "md" | "sm";
  ariaLabel?: string;
}) {
  const className = buttonClass({ variant, size, fit, pending, disabled });
  const content = (
    <>
      {pending && (
        <svg className="spin size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
          <path
            d="M12 4a8 8 0 0 1 8 8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </>
  );

  if (href) {
    const blocked = disabled || pending;
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        aria-busy={pending ? true : undefined}
        aria-disabled={blocked ? true : undefined}
        tabIndex={blocked ? -1 : undefined}
        onClick={
          blocked
            ? (event) => {
                event.preventDefault();
              }
            : onClick
        }
        className={blocked ? `${className} pointer-events-none` : className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || pending}
      aria-label={ariaLabel}
      aria-busy={pending ? true : undefined}
      className={className}
    >
      {content}
    </button>
  );
}
