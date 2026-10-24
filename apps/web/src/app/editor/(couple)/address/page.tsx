import { redirect } from "next/navigation";
import { AddressForm } from "@/components/editor/AddressForm";
import { EditorFrame } from "@/components/editor/EditorFrame";
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
    coupleNames,
  } = state.registry;

  return (
    <EditorFrame
      title={copy.editor.address.title}
      lead={coupleNames}
      back="/editor/settings"
      nav="settings"
    >
      <AddressForm
        city={city}
        street={shippingStreet}
        entrance={shippingEntrance}
        floor={shippingFloor}
        apartment={shippingApartment}
        notes={shippingNotes}
        postalCode={shippingPostalCode}
      />
    </EditorFrame>
  );
}
