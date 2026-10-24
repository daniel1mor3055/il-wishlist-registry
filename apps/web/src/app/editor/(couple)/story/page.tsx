import { redirect } from "next/navigation";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { StoryForm } from "@/components/editor/StoryForm";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.story.title,
  robots: { index: false, follow: false },
};

export default async function StoryPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { story, coverImageUrl, coupleNames } = state.registry;

  return (
    <EditorFrame
      title={copy.editor.story.title}
      lead={coupleNames}
      back="/editor/settings"
      nav="settings"
    >
      <StoryForm story={story} coverImageUrl={coverImageUrl} />
    </EditorFrame>
  );
}
