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

  const {
    city,
    shippingStreet,
    shippingEntrance,
    shippingFloor,
    shippingApartment,
    shippingNotes,
    shippingPostalCode,
  } = state.registry;

  return (
    <EditorShell title={copy.editor.address.title} back="/editor/settings">
      <AddressForm
        city={city}
        street={shippingStreet}
        entrance={shippingEntrance}
        floor={shippingFloor}
        apartment={shippingApartment}
        notes={shippingNotes}
        postalCode={shippingPostalCode}
      />
    </EditorShell>
  );
}
