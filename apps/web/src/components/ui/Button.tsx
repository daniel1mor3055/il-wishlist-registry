export function Button({
  children,
  type = "submit",
  disabled = false,
  pending = false,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending ? true : undefined}
      className={
        pending
          ? "flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-brand-deep text-copy font-medium text-paper shadow-lift-sm"
          : disabled
            ? "flex h-14 w-full items-center justify-center rounded-pill bg-brand-deep text-copy font-medium text-paper opacity-30"
            : "press focus-ring flex h-14 w-full items-center justify-center rounded-pill bg-brand-deep text-copy font-medium text-paper shadow-lift-sm hover:bg-brand-hover active:bg-brand-press motion-safe:transition-colors"
      }
    >
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
    </button>
  );
}
