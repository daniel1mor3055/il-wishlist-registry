import { redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
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

  const { story, coverImageUrl, babyGender } = state.registry;

  return (
    <EditorShell title={copy.editor.story.title} back="/editor/settings">
      <StoryForm story={story} coverImageUrl={coverImageUrl} babyGender={babyGender} />
    </EditorShell>
  );
}
