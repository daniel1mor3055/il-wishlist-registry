import { redirect } from "next/navigation";
import { AddItem } from "@/components/editor/AddItem";
import { EditorShell } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";
import { getOwnerRegistry, ownerFetch } from "@/lib/owner";
import type { CatalogPage } from "@/lib/types";

type Props = {
  searchParams: Promise<{ q?: string; category?: string; tab?: string }>;
};

export const metadata = {
  title: copy.editor.add.title,
  robots: { index: false, follow: false },
};

const EMPTY: CatalogPage = { results: [], total: 0 };

/** Enough to fill a phone screen twice over without paging. */
const LIMIT = 24;

export default async function AddItemPage({ searchParams }: Props) {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { q, category, tab } = await searchParams;
  const search = new URLSearchParams({ limit: String(LIMIT) });
  if (q) search.set("q", q);
  if (category) search.set("category", category);

  // Rendered server-side, so the results are in the HTML and the search survives
  // a reload. Only the catalog tab needs them.
  const result =
    tab === "manual"
      ? { ok: true as const, data: EMPTY }
      : await ownerFetch<CatalogPage>(`/catalog/search?${search}`);

  return (
    <EditorShell title={copy.editor.add.title} back="/editor">
      <AddItem
        page={result.ok ? result.data : EMPTY}
        query={q ?? ""}
        category={category ?? null}
        tab={tab === "manual" ? "manual" : "search"}
      />
    </EditorShell>
  );
}
