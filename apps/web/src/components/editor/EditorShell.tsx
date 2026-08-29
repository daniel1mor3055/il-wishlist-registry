import Link from "next/link";

/**
 * The frame every editor screen sits in.
 *
 * Same 430px column as the guest page, because the couple builds their list on
 * the same phone the guests will open it on. Deliberately plainer: this is a
 * tool, and the guest surface is the thing that has to be beautiful.
 */
export function EditorShell({
  title,
  back,
  action,
  children,
}: {
  title: string;
  /** A route, not a history pop: these screens are linkable. */
  back?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        {back && (
          <Link
            href={back}
            aria-label="חזרה"
            className="-ms-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-neutral-tint"
          >
            {/* Back points right in RTL (PRD section 8). */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <h1 className="flex-1 truncate text-body font-bold text-ink">{title}</h1>
        {action}
      </header>

      <div className="flex flex-1 flex-col px-4 py-4">{children}</div>
    </main>
  );
}

/** A refusal from the API, rendered where the couple was looking. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-small text-danger">
      {message}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-tiny text-ink-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary";
