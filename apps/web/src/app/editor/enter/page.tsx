import { EditorShell } from "@/components/editor/EditorShell";
import { EnterForm } from "@/components/editor/EnterForm";
import { copy } from "@/lib/copy";

type Props = { searchParams: Promise<{ dead?: string }> };

export const metadata = {
  title: copy.editor.enter.title,
  robots: { index: false, follow: false },
};

/**
 * The door: one field, one button, no password (D23).
 *
 * The link itself lands on `/editor/session`, which is a route handler because
 * it sets a cookie. A spent or expired link redirects back here with `dead=1`,
 * so the message about it appears next to the form that fixes it.
 */
export default async function EnterPage({ searchParams }: Props) {
  const { dead } = await searchParams;

  return (
    <EditorShell title={copy.editor.enter.title}>
      <EnterForm deadLink={dead === "1"} />
    </EditorShell>
  );
}
