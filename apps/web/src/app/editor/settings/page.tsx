import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/editor/actions";
import { EditorShell } from "@/components/editor/EditorShell";
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
    <EditorShell title={copy.editor.settings.title} back="/editor">
      <div className="flex flex-1 flex-col gap-2">
        <SettingsCard
          href="/editor/story"
          title={copy.editor.story.title}
          icon={<StoryIcon />}
        />
        <SettingsCard
          href="/editor/gender"
          title={copy.editor.gender.label}
          icon={<GenderIcon />}
        />
        <SettingsCard
          href="/editor/payment?from=settings"
          title={copy.editor.payment.title}
          icon={<PaymentIcon />}
        />
        <SettingsCard
          href="/editor/address"
          title={copy.editor.address.title}
          icon={<AddressIcon />}
        />

        <div className="mt-auto pt-4">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full py-2 text-center text-small font-medium text-ink-muted transition-opacity active:opacity-70"
            >
              {copy.editor.settings.signOut}
            </button>
          </form>
        </div>
      </div>
    </EditorShell>
  );
}

function SettingsCard({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-right transition-transform active:scale-[0.99]"
    >
      <span className="shrink-0 text-ink">{icon}</span>
      <span className="min-w-0 flex-1 text-small font-medium text-ink">{title}</span>
    </Link>
  );
}

function StoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 6.75A1.75 1.75 0 0 1 6.25 5h11.5A1.75 1.75 0 0 1 19.5 6.75v10.5A1.75 1.75 0 0 1 17.75 19H6.25A1.75 1.75 0 0 1 4.5 17.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m4.75 16.5 4.3-4.3a1 1 0 0 1 1.4 0l2.1 4.3 2.2-2.2a1 1 0 0 1 1.4 0l3.1 3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.25" r="1.15" fill="currentColor" />
    </svg>
  );
}

function GenderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9.5" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.5" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.75h8A2.25 2.25 0 0 1 18.25 7v12.25A1.75 1.75 0 0 1 16.5 21h-9a1.75 1.75 0 0 1-1.75-1.75V7A2.25 2.25 0 0 1 8 4.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9.5 17.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
