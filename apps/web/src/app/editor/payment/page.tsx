import { redirect } from "next/navigation";
import { PaymentForm } from "@/components/editor/PaymentForm";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.payment.title,
  robots: { index: false, follow: false },
};

export default async function PaymentPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { bitHandle, payboxHandle, paymentDisplayName, coupleNames, items } =
    state.registry;
  const envelope = items.find((item) => item.kind === "fund" && item.isActive);
  const vouchers = items
    .filter((item) => item.kind === "voucher" && item.isActive && item.chainSlug)
    .map((item) => ({
      id: item.id,
      chainSlug: item.chainSlug as string,
      contributedAgorot: item.contributedAgorot,
    }));

  return (
    <EditorShell title={copy.editor.payment.title} back="/editor/settings">
      <PaymentForm
        bitHandle={bitHandle}
        payboxHandle={payboxHandle}
        paymentDisplayName={paymentDisplayName}
        coupleNames={coupleNames}
        envelope={
          envelope
            ? { id: envelope.id, contributedAgorot: envelope.contributedAgorot }
            : null
        }
        vouchers={vouchers}
      />
    </EditorShell>
  );
}
