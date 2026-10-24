import { notFound, redirect } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { ItemSettings } from "@/components/editor/ItemSettings";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: copy.editor.itemSettings.title,
  robots: { index: false, follow: false },
};

export default async function ItemSettingsPage({ params }: Props) {
  const { id } = await params;
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  // Found in the registry the session owns, so someone else's item id is a 404
  // here for the same reason it is one at the API.
  const item = state.registry.items.find((one) => one.id === id);
  if (!item) notFound();
  if (item.kind === "fund") redirect("/editor/payment");

  return (
    <EditorShell title={item.title} back="/editor">
      <ItemSettings item={item} />
    </EditorShell>
  );
}
