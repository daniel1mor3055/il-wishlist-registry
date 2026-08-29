import { redirect } from "next/navigation";
import { CreateWizard } from "@/components/editor/CreateWizard";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.wizard.title,
  robots: { index: false, follow: false },
};

export default async function NewRegistryPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  // One registry per couple, so a couple who already has one has nothing to do
  // here. Sending them to the editor beats a 409 from the wizard's last step.
  if (state.registry) redirect("/editor");

  return (
    <EditorShell title={copy.editor.wizard.title}>
      <CreateWizard />
    </EditorShell>
  );
}
