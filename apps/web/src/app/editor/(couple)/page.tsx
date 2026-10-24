import { redirect } from "next/navigation";
import { EditorHome } from "@/components/editor/EditorHome";
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

  const {
    slug,
    coupleNames,
    publishedAt,
    closedAt,
    itemsTotal,
    itemsClaimed,
    items,
    bitHandle,
    payboxHandle,
  } = state.registry;
  const hasBit = Boolean((bitHandle ?? "").trim());
  const hasPaybox = Boolean((payboxHandle ?? "").trim());

  return (
    // Field by field, so payment numbers never reach a screen that does not show them (D13, D50).
    <EditorHome
      registry={{
        slug,
        coupleNames,
        publishedAt,
        closedAt,
        itemsTotal,
        itemsClaimed,
        items,
        hasBit,
        hasPaybox,
      }}
    />
  );
}
