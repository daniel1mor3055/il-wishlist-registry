import { redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { ShareForm } from "@/components/editor/ShareForm";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.share.title,
  robots: { index: false, follow: false },
};

export default async function SharePage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");
  if (!state.registry.publishedAt) redirect("/editor");

  const { slug, coupleNames, story, coverImageUrl } = state.registry;

  return (
    <EditorShell title={copy.editor.share.title} back="/editor">
      <ShareForm
        slug={slug}
        coupleNames={coupleNames}
        story={story}
        coverImageUrl={coverImageUrl}
      />
    </EditorShell>
  );
}
