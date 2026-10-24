import { EditorFrame } from "@/components/editor/EditorFrame";
import { EnterForm } from "@/components/editor/EnterForm";
import { EnterArch } from "@/components/illustrations/EnterArch";
import { copy } from "@/lib/copy";

type Props = { searchParams: Promise<{ dead?: string }> };

export const metadata = {
  title: copy.editor.enter.title,
  robots: { index: false, follow: false },
};

/** A spent or expired link returns here with `dead=1` (the session route sets the cookie). */
export default async function EnterPage({ searchParams }: Props) {
  const { dead } = await searchParams;

  return (
    <EditorFrame
      title={copy.editor.enter.title}
      lead={copy.editor.enter.body}
      illustration={<EnterArch />}
    >
      <EnterForm deadLink={dead === "1"} />
    </EditorFrame>
  );
}
