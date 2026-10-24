import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/editor/actions";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { ListLifecycle } from "@/components/editor/ListLifecycle";
import { C10SettingsBag } from "@/components/illustrations/C10SettingsBag";
import { Icon, type IconName } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.settings.title,
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  return (
    <EditorFrame
      title={copy.editor.settings.title}
      lead={state.registry.coupleNames}
      back="/editor"
      nav="settings"
    >
      <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <C10SettingsBag />
        <div className="min-w-0 px-3 pb-3 pt-4 lg:px-5 lg:pb-5 lg:pt-6">
          <SettingsGroup heading={copy.editor.settings.groups.guests}>
            <SettingsRow
              href="/editor/story"
              title={copy.editor.story.title}
              hint={copy.editor.settings.hints.story}
              icon="ic-image"
            />
            <SettingsRow
              href="/editor/gender"
              title={copy.editor.gender.label}
              hint={copy.editor.settings.hints.gender}
              icon="ic-palette"
            />
          </SettingsGroup>
          <SettingsGroup heading={copy.editor.settings.groups.giving} divided>
            <SettingsRow
              href="/editor/payment?from=settings"
              title={copy.editor.payment.title}
              hint={copy.editor.settings.hints.payment}
              icon="ic-phone"
            />
            <SettingsRow
              href="/editor/address"
              title={copy.editor.address.title}
              hint={copy.editor.settings.hints.address}
              icon="ic-home"
            />
          </SettingsGroup>
        </div>
      </div>

      {state.registry.publishedAt !== null && (
        <section
          aria-labelledby="lifecycle-title"
          className="mt-6 rounded-sheet bg-brand-soft p-3 shadow-lift-sm lg:p-5"
        >
          <h2 id="lifecycle-title" className="px-2 pt-1 text-fine font-medium text-charcoal">
            {copy.editor.settings.groups.list}
          </h2>
          <ListLifecycle closed={state.registry.closedAt !== null} />
        </section>
      )}

      <form action={signOut} className="mt-6 text-center lg:text-start">
        <button
          type="submit"
          className="focus-ring inline-flex h-11 items-center rounded-pill px-5 text-copy font-medium text-brand-link hover:bg-brand-softer motion-safe:transition-colors"
        >
          {copy.editor.settings.signOut}
        </button>
      </form>
    </EditorFrame>
  );
}

function SettingsGroup({
  heading,
  divided = false,
  children,
}: {
  heading: string;
  divided?: boolean;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        className={
          divided
            ? "mt-4 border-t border-hairline px-2 pt-4 text-fine font-medium text-slate"
            : "px-2 text-fine font-medium text-slate"
        }
      >
        {heading}
      </h2>
      <ul className="mt-1.5">{children}</ul>
    </section>
  );
}

function SettingsRow({
  href,
  title,
  hint,
  icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: IconName;
}) {
  return (
    <li>
      <Link
        href={href}
        className="press focus-ring flex min-h-16 items-center gap-3 rounded-tile px-2 py-2.5 hover:bg-cloud motion-safe:transition-colors"
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-softer text-brand-deep"
        >
          <Icon name={icon} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-copy font-medium text-graphite">{title}</span>
          <span className="mt-0.5 block text-fine text-slate">{hint}</span>
        </span>
        <Icon name="ic-chev-end" className="size-5 shrink-0 text-brand-deep" />
      </Link>
    </li>
  );
}
