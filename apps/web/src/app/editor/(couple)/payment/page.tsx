import { redirect } from "next/navigation";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { PaymentForm } from "@/components/editor/PaymentForm";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.payment.title,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ setup?: string; from?: string }>;
};

/** List door can require a number and add the envelope; settings only edits the handle (D13, D41). */
export default async function PaymentPage({ searchParams }: Props) {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { setup, from } = await searchParams;
  const isSetup = setup === "1";
  const fromSettings = from === "settings";
  const hasFund = state.registry.items.some((item) => item.kind === "fund");
  const { bitHandle, payboxHandle, paymentDisplayName, coupleNames } = state.registry;

  return (
    <EditorFrame
      title={copy.editor.payment.title}
      lead={coupleNames}
      back={fromSettings ? "/editor/settings" : "/editor"}
      nav="settings"
    >
      <PaymentForm
        bitHandle={bitHandle}
        payboxHandle={payboxHandle}
        paymentDisplayName={paymentDisplayName}
        coupleNames={coupleNames}
        requireNumber={isSetup || (!fromSettings && !bitHandle && !payboxHandle)}
        needsEnvelope={isSetup && !hasFund}
        returnTo={fromSettings ? null : "/editor"}
      />
    </EditorFrame>
  );
}
