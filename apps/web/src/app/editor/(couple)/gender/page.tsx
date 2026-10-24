import { redirect } from "next/navigation";
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
    <GenderForm babyGender={state.registry.babyGender} coupleNames={state.registry.coupleNames} />
  );
}
