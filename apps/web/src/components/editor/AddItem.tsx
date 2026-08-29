"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { addCatalogItem, addManualItem } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Price } from "@/components/primitives/Price";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import type { CatalogPage, CatalogResult, Category } from "@/lib/types";

/**
 * Two ways to add something (PRD ed-C3).
 *
 * Pasting a chain URL and having it resolved is the third, and it needs a
 * resolver that fetches and parses a page; it lands with the checkpoint that
 * owns it. Until then the manual tab takes a link as plain text, which is honest
 * about what we do with it: show it to the guest.
 *
 * Search state lives in the URL, not in this component. That makes the results
 * server-rendered, the back button work, and a search shareable between the two
 * phones a couple is using.
 */

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function AddItem({
  page,
  query,
  category,
  tab,
}: {
  page: CatalogPage;
  query: string;
  category: string | null;
  tab: "search" | "manual";
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") merged.delete(key);
      else merged.set(key, value);
    }
    router.replace(`/editor/add?${merged.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Tab active={tab === "search"} onClick={() => go({ tab: null })}>
          {copy.editor.add.searchTab}
        </Tab>
        <Tab active={tab === "manual"} onClick={() => go({ tab: "manual" })}>
          {copy.editor.add.manualTab}
        </Tab>
      </div>

      {tab === "search" ? (
        <SearchTab
          page={page}
          query={query}
          category={category}
          onSearch={(q) => go({ q, page: null })}
          onCategory={(next) => go({ category: next })}
        />
      ) : (
        <ManualTab />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-btn py-2 text-small font-medium transition-colors ${
        active ? "bg-primary text-white" : "bg-neutral-tint text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}

function SearchTab({
  page,
  query,
  category,
  onSearch,
  onCategory,
}: {
  page: CatalogPage;
  query: string;
  category: string | null;
  onSearch: (query: string) => void;
  onCategory: (category: string | null) => void;
}) {
  const [text, setText] = useState(query);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(text.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={copy.editor.add.searchPlaceholder}
          className={inputClass}
        />
        <button
          type="submit"
          className="shrink-0 rounded-btn bg-primary px-4 text-small font-medium text-white"
        >
          {copy.editor.add.search}
        </button>
      </form>

      <div className="hide-scroll -mx-4 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((one) => {
          const on = category === one;
          return (
            <button
              key={one}
              type="button"
              aria-pressed={on}
              onClick={() => onCategory(on ? null : one)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-tiny font-medium transition-colors ${
                on ? "bg-primary text-white" : "border border-border bg-surface text-ink"
              }`}
            >
              {CATEGORY_LABELS[one]}
            </button>
          );
        })}
      </div>

      {page.results.length === 0 ? (
        <p className="py-6 text-center text-small text-ink-muted">
          {query || category ? copy.editor.add.noResults : copy.editor.add.browsePrompt}
        </p>
      ) : (
        <>
          <p className="text-tiny text-ink-muted">
            {copy.editor.add.resultCount(page.results.length, page.total)}
          </p>
          <ul className="flex flex-col gap-2">
            {page.results.map((result) => (
              <ResultRow key={result.id} result={result} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ResultRow({ result }: { result: CatalogResult }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-surface p-2.5">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-image-bg">
        <ItemImage
          src={result.imageUrl}
          alt={result.title}
          category={result.category}
          title={result.title}
          sizes="56px"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-small font-medium text-ink">
          {result.title}
        </span>
        <span className="flex items-center gap-2">
          <Price agorot={result.priceAgorot} />
          <span className="text-tiny text-ink-muted">{result.chainNameHe}</span>
        </span>
        <FormError message={error} />
      </span>

      <button
        type="button"
        disabled={pending || added}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const outcome = await addCatalogItem(result.id);
            if (outcome.ok) setAdded(true);
            else setError(outcome.error);
          })
        }
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-tiny font-medium transition-colors disabled:opacity-60 ${
          added ? "bg-success text-white" : "bg-primary text-white"
        }`}
      >
        {added ? copy.editor.add.added : copy.editor.add.addThis}
      </button>
    </li>
  );
}

function ManualTab() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shekels = Number(price);
  const priceAgorot =
    price.trim() === "" || !Number.isFinite(shekels) ? null : Math.round(shekels * 100);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await addManualItem({
            title: title.trim(),
            priceAgorot,
            category,
            canonicalUrl: link.trim() || null,
          });
          if (result.ok) router.push("/editor");
          else setError(result.error);
        });
      }}
    >
      <Field label={copy.editor.add.manualTitleLabel}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={copy.editor.add.manualTitlePlaceholder}
          className={inputClass}
        />
      </Field>

      <Field label={copy.editor.add.manualPriceLabel}>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder={copy.editor.add.manualPricePlaceholder}
          className={inputClass}
        />
      </Field>

      <Field label={copy.editor.add.manualCategoryLabel}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((one) => {
            const on = category === one;
            return (
              <button
                key={one}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(on ? null : one)}
                className={`rounded-full px-3.5 py-1.5 text-tiny font-medium transition-colors ${
                  on
                    ? "bg-primary text-white"
                    : "border border-border bg-surface text-ink"
                }`}
              >
                {CATEGORY_LABELS[one]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={copy.editor.add.manualLinkLabel}>
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder={copy.editor.add.manualLinkPlaceholder}
          dir="ltr"
          className={`${inputClass} text-start`}
        />
      </Field>

      <FormError message={error} />

      <PrimaryButton type="submit" disabled={pending || title.trim().length < 2}>
        {copy.editor.add.manualSubmit}
      </PrimaryButton>
    </form>
  );
}
