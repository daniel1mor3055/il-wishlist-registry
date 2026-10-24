import Link from "next/link";
import { redirect } from "next/navigation";
import { Hero, HowItWorks } from "@/components/registry/Hero";
import { RegistryClient } from "@/components/registry/RegistryClient";
import {
  ClosedRegistrySummary,
  GuestBrandBar,
  GuestFooter,
} from "@/components/registry/RegistryShell";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";
import { ownerToPublicRegistry } from "@/lib/preview";
import { themeFromGender } from "@/lib/theme";

export const metadata = {
  title: copy.editor.preview.banner,
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const registry = ownerToPublicRegistry(state.registry);
  const closed = registry.lifecycle === "closed";

  return (
    <div
      data-theme={themeFromGender(state.registry.babyGender)}
      className="flex min-h-dvh flex-col bg-page-sand font-rubik text-charcoal antialiased"
    >
      <header className="sticky top-0 z-40 bg-brand-soft">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-1 px-2 lg:h-16 lg:px-4">
          <Link
            href="/editor"
            className="press focus-ring inline-flex h-11 shrink-0 items-center gap-1 rounded-full pe-3 ps-1 text-copy font-medium text-brand-deep hover:bg-paper/60"
          >
            <Icon name="ic-chev-start" className="size-6" />
            {copy.editor.preview.back}
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-fine font-medium text-graphite lg:text-title">
            {copy.editor.preview.banner}
          </h1>
        </div>
      </header>

      <div className="p-2 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-sheet bg-paper shadow-lift-md">
          {closed ? (
            <ClosedRegistrySummary registry={registry} />
          ) : (
            <main>
              <GuestBrandBar />
              <Hero registry={registry} titleAs="p" />
              <HowItWorks intoFilter={registry.items.length > 0} />
              <RegistryClient registry={registry} preview />
              <GuestFooter />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
