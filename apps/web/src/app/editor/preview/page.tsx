import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero, HowItWorks } from "@/components/registry/Hero";
import { RegistryClient } from "@/components/registry/RegistryClient";
import { ClosedRegistrySummary } from "@/components/registry/RegistryShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";
import { ownerToPublicRegistry } from "@/lib/preview";

export const metadata = {
  title: copy.editor.preview.banner,
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const registry = ownerToPublicRegistry(state.registry);

  return (
    <div className="paper-wash flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-2 px-4 py-3">
          <Link
            href="/editor"
            aria-label={copy.editor.preview.back}
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
          <h1 className="flex-1 truncate text-body font-bold text-ink">
            {copy.editor.preview.banner}
          </h1>
        </div>
      </header>

      {registry.lifecycle === "closed" ? (
        <ClosedRegistrySummary registry={registry} />
      ) : (
        <main className="paper-wash mx-auto flex w-full max-w-[430px] flex-1 flex-col">
          <Hero registry={registry} />
          <HowItWorks />

          {registry.items.length > 0 && (
            <div className="px-5 pt-4">
              <a
                href="#list"
                className="block w-full rounded-btn bg-primary py-3.5 text-center text-body font-medium text-on-primary hover:bg-primary-hover active:bg-primary-active"
              >
                {copy.hero.cta}
              </a>
            </div>
          )}

          <div id="list" className="scroll-mt-0" />
          <RegistryClient registry={registry} preview />
        </main>
      )}
    </div>
  );
}
