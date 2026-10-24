import { redirect } from "next/navigation";
import { AddItem } from "@/components/editor/AddItem";
import { EditorFrame } from "@/components/editor/EditorFrame";
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

/** Enough to fill a phone screen twice over without paging. */
const LIMIT = 24;

const EMPTY: CatalogPage = { results: [], total: 0 };

export default async function AddItemPage({ searchParams }: Props) {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  const { q, category, tab } = await searchParams;
  const search = new URLSearchParams({ limit: String(LIMIT) });
  if (q) search.set("q", q);
  if (category) search.set("category", category);

  // Server HTML so a reload keeps the search. The manual tab does not need it.
  const result =
    tab === "manual"
      ? { ok: true as const, data: EMPTY }
      : await ownerFetch<CatalogPage>(`/catalog/search?${search}`);

  return (
    <EditorFrame
      title={copy.editor.add.title}
      lead={state.registry.coupleNames}
      back="/editor"
      nav="add"
    >
      <AddItem
        page={result.ok ? result.data : EMPTY}
        query={q ?? ""}
        category={category ?? null}
        tab={tab === "manual" ? "manual" : "search"}
      />
    </EditorFrame>
  );
}
