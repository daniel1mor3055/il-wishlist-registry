import { redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { GenderForm } from "@/components/editor/GenderForm";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.gender.label,
  robots: { index: false, follow: false },
};

export default async function GenderPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  return (
    <EditorShell title={copy.editor.gender.label} back="/editor/settings">
      <GenderForm babyGender={state.registry.babyGender} />
    </EditorShell>
  );
}
