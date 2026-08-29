import { redirect } from "next/navigation";
import { AddressForm } from "@/components/editor/AddressForm";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.address.title,
  robots: { index: false, follow: false },
};

export default async function AddressPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { city, shippingStreet, shippingApartment, shippingPostalCode } = state.registry;

  return (
    <EditorShell title={copy.editor.address.title} back="/editor">
      <AddressForm
        city={city}
        street={shippingStreet}
        apartment={shippingApartment}
        postalCode={shippingPostalCode}
      />
    </EditorShell>
  );
}
