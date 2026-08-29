import { redirect } from "next/navigation";
import { signOut } from "@/app/editor/actions";
import { EditorHome } from "@/components/editor/EditorHome";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.home.title,
  robots: { index: false, follow: false },
};

export default async function EditorPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { slug, coupleNames, publishedAt, itemsTotal, itemsClaimed, items } =
    state.registry;

  return (
    <EditorShell title={copy.editor.home.title} action={<SignOut />}>
      {/* Field by field, so the payment handle does not ride along into the
          browser inside a screen that never shows it. */}
      <EditorHome
        registry={{ slug, coupleNames, publishedAt, itemsTotal, itemsClaimed, items }}
      />
    </EditorShell>
  );
}

/** A form, so signing out is a POST and not a link a prefetch can follow. */
function SignOut() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-1 py-1 text-small font-medium text-ink-muted transition-opacity active:opacity-70"
      >
        {copy.editor.enter.signOut}
      </button>
    </form>
  );
}
