import { redirect } from "next/navigation";
import { PaymentForm } from "@/components/editor/PaymentForm";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry } from "@/lib/owner";

export const metadata = {
  title: copy.editor.payment.title,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ setup?: string; from?: string }>;
};

/**
 * One GET for the number (D13, D41). Two doors: the list (add or tap חיבוק)
 * and settings (change the number later). Settings does not re-add a removed
 * tile.
 */
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
    <EditorShell
      title={copy.editor.payment.title}
      back={fromSettings ? "/editor/settings" : "/editor"}
    >
      <PaymentForm
        bitHandle={bitHandle}
        payboxHandle={payboxHandle}
        paymentDisplayName={paymentDisplayName}
        coupleNames={coupleNames}
        requireNumber={
          isSetup || (!fromSettings && !bitHandle && !payboxHandle)
        }
        needsEnvelope={isSetup && !hasFund}
        returnTo={fromSettings ? null : "/editor"}
      />
    </EditorShell>
  );
}
