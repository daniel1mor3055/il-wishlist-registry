import { redirect } from "next/navigation";
import { EditorHome } from "@/components/editor/EditorHome";
import { EditorIconLink, EditorShell } from "@/components/editor/EditorShell";
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

  const { slug, coupleNames, publishedAt, itemsTotal, itemsClaimed, items, bitHandle, payboxHandle } =
    state.registry;
  const hasBit = Boolean((bitHandle ?? "").trim());
  const hasPaybox = Boolean((payboxHandle ?? "").trim());

  return (
    <EditorShell title={copy.editor.home.title} action={<HomeHeaderActions />}>
      {/* Field by field, so the payment numbers do not ride along into the
          browser inside a screen that never shows them. Presence of a rail
          is enough to title the envelope (D13, D50). */}
      <EditorHome
        registry={{
          slug,
          coupleNames,
          publishedAt,
          itemsTotal,
          itemsClaimed,
          items,
          hasBit,
          hasPaybox,
        }}
      />
    </EditorShell>
  );
}

/** RTL end of the header: preview, then settings. Share stays on the published card. */
function HomeHeaderActions() {
  return (
    <>
      <EditorIconLink href="/editor/preview" label={copy.editor.home.preview}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.04 12.32a1 1 0 0 1 0-.64C3.42 7.51 7.36 4.5 12 4.5s8.58 3.01 9.96 7.18a1 1 0 0 1 0 .64C20.58 16.49 16.64 19.5 12 19.5c-4.64 0-8.58-3.01-9.96-7.18Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </EditorIconLink>
      <EditorIconLink href="/editor/settings" label={copy.editor.settings.gearLabel}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.345 1.452l-1.043.8c-.293.225-.438.602-.386.96a6.98 6.98 0 0 1 0 .255c-.052.357.093.735.386.96l1.043.799c.48.368.609 1.02.345 1.452l-1.296 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .345-1.452l1.043-.799c.293-.226.438-.602.386-.96a6.52 6.52 0 0 1 0-.255c.052-.357-.093-.735-.386-.96l-1.043-.8a1.125 1.125 0 0 1-.345-1.452l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </EditorIconLink>
    </>
  );
}
