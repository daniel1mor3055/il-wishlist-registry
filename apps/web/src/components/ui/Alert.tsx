export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-tile bg-alert-wash px-4 py-3.5 text-copy text-alert-ink shadow-lift-xs"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-alert text-fine font-semibold text-paper"
      >
        !
      </span>
      {children}
    </p>
  );
}
