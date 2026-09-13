import { copy } from "@/lib/copy";
import type { PublicRegistry } from "@/lib/types";

/**
 * G10. The lifecycle and error shells.
 *
 * A closed registry is a read-only thank-you, and a missing one assumes a
 * WhatsApp link that got truncated - which is also what an unpublished registry
 * looks like, deliberately (D30). These are separate from an exception: they
 * are legitimate states with their own copy, and they must still render valid
 * Open Graph metadata.
 */
export function RegistryShell({
  message,
  detail,
  children,
}: {
  message: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="paper-wash mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6">
        <p className="text-h3 font-bold text-ink">{message}</p>
        {detail && <p className="text-small text-ink-muted">{detail}</p>}
        {children}
      </div>
      <span className="text-tiny text-muted">{copy.common.footer}</span>
    </main>
  );
}

/** A closed registry keeps a summary of what happened, and offers no giving. */
export function ClosedRegistrySummary({ registry }: { registry: PublicRegistry }) {
  return (
    <RegistryShell
      message={copy.shell.closed}
      detail={copy.hero.progress(registry.itemsClaimed, registry.itemsTotal)}
    >
      <p className="text-small text-ink">{registry.coupleNames}</p>
    </RegistryShell>
  );
}
