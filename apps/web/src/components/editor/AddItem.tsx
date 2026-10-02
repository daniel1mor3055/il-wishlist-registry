"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { addCatalogItem, addLinkItem, addManualItem, resolveCatalogLink } from "@/app/editor/actions";
import {
  Field,
  FormError,
  inputClass,
  ViewOnSiteLink,
} from "@/components/editor/EditorShell";
import { ShopChip } from "@/components/primitives/Badges";
import { PrimaryButton, SecondaryButton } from "@/components/primitives/Buttons";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Price } from "@/components/primitives/Price";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import type {
  CatalogPage,
  CatalogResolveVariant,
  CatalogResolvedNeedsVariant,
  CatalogResolvedProduct,
  CatalogResult,
  Category,
} from "@/lib/types";

/**
 * Add screen (PRD ed-C3).
 *
 * A shop link is the first region, above search and manual. Search stays in
 * the URL. A read that does not resolve prefills the manual form in state.
 */

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

type ManualOffer = {
  link: string;
  message: string;
  detail: string | null;
  retryUrl: string | null;
};

type PastePhase =
  | { kind: "idle" }
  | { kind: "notUrl" }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "added" }
  | { kind: "product"; url: string; product: CatalogResolvedProduct }
  | { kind: "needsVariant"; url: string; product: CatalogResolvedNeedsVariant };

function extractUrl(raw: string): string | null {
  const matches = raw.match(/https?:\/\/[^\s<>"']+/gi);
  if (!matches || matches.length === 0) return null;
  const https = matches.find((one) => one.slice(0, 8).toLowerCase() === "https://");
  return (https ?? matches[0])
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/[)\].,;:!?]+$/g, "");
}

function offerFor(reason: string, link: string): ManualOffer {
  if (reason === "not_product") {
    return { link, message: copy.editor.add.pasteNotProduct, detail: null, retryUrl: null };
  }
  if (reason === "unknown_host" || reason === "not_https") {
    return { link, message: copy.editor.add.pasteUnknownHost, detail: null, retryUrl: null };
  }
  if (reason === "fetch_failed") {
    return {
      link,
      message: copy.editor.add.pasteFetchFailed,
      detail: copy.editor.add.pasteFetchFailedDetail,
      retryUrl: link,
    };
  }
  return {
    link,
    message: copy.editor.add.pasteBadDocument,
    detail: null,
    retryUrl: null,
  };
}

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
  const generation = useRef(0);
  const pendingUrl = useRef<string | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<PastePhase>({ kind: "idle" });
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [offer, setOffer] = useState<ManualOffer | null>(null);
  const [resolving, startResolve] = useTransition();
  const [saving, startSave] = useTransition();

  const showManual = offer !== null || tab === "manual";

  function go(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") merged.delete(key);
      else merged.set(key, value);
    }
    router.replace(`/editor/add?${merged.toString()}`);
  }

  function submit(raw: string) {
    const id = ++generation.current;
    setSaveError(null);
    setSelectedVariantId(null);

    const url = extractUrl(raw);
    if (!url) {
      pendingUrl.current = null;
      setText(raw.trim());
      setOffer(null);
      setPhase({ kind: "notUrl" });
      return;
    }

    pendingUrl.current = url;
    if (offer?.link !== url) setOffer(null);
    setText(url);
    setPhase({ kind: "pending" });
    startResolve(async () => {
      const result = await resolveCatalogLink(url);
      if (generation.current !== id) return;
      pendingUrl.current = null;
      if (!result.ok) {
        setOffer(null);
        setPhase({ kind: "error", message: result.error });
        return;
      }
      const data = result.data;
      if (data.outcome === "unresolved") {
        const echoed = typeof data.url === "string" ? data.url.trim() : "";
        const link = echoed || url;
        setText(link);
        setOffer(offerFor(data.reason, link));
        setPhase({ kind: "idle" });
        return;
      }
      setOffer(null);
      if (data.outcome === "needsVariant") {
        setPhase({ kind: "needsVariant", url, product: data });
        return;
      }
      if (data.outcome === "product") {
        setPhase({ kind: "product", url, product: data });
        return;
      }
      setPhase({ kind: "error", message: copy.shell.genericError });
    });
  }

  function save() {
    if (phase.kind !== "product" && phase.kind !== "needsVariant") return;
    const variantId = phase.kind === "product" ? phase.product.variantId : selectedVariantId;
    if (phase.kind === "needsVariant" && !variantId) return;
    const id = generation.current;
    const url = phase.url;
    setSaveError(null);
    startSave(async () => {
      const result = await addLinkItem({ url, variantId });
      if (generation.current !== id) return;
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setText("");
      setSelectedVariantId(null);
      setOffer(null);
      setPhase({ kind: "added" });
    });
  }

  const variantList =
    phase.kind === "needsVariant" ? (phase.product.variants ?? []) : [];
  const selectedVariant = variantList.find((one) => one.id === selectedVariantId) ?? null;
  const draftOpen = phase.kind === "product" || phase.kind === "needsVariant";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3" aria-busy={phase.kind === "pending" || resolving}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(text);
          }}
        >
          <Field label={copy.editor.add.pasteLabel} hint={copy.editor.add.pasteHint}>
            <input
              value={text}
              onChange={(event) => {
                const next = event.target.value;
                setText(next);
                const leftResolved =
                  (phase.kind === "product" || phase.kind === "needsVariant") &&
                  next.trim() !== phase.url;
                const leftPending =
                  phase.kind === "pending" && next.trim() !== pendingUrl.current;
                if (leftResolved || leftPending) {
                  generation.current += 1;
                  pendingUrl.current = null;
                  setSaveError(null);
                  setSelectedVariantId(null);
                  setPhase({ kind: "idle" });
                  return;
                }
                if (phase.kind === "added" || phase.kind === "notUrl" || phase.kind === "error") {
                  setPhase({ kind: "idle" });
                }
              }}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                if (!pasted) return;
                event.preventDefault();
                submit(pasted);
              }}
              placeholder={copy.editor.add.pastePlaceholder}
              dir={/https?:\/\/\S/i.test(text) ? "ltr" : "rtl"}
              inputMode="url"
              enterKeyHint="go"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className={`${inputClass} text-start`}
            />
          </Field>
        </form>

        {phase.kind === "pending" && (
          <p role="status" className="text-small text-ink-muted">
            {copy.editor.add.pastePending}
          </p>
        )}
        {phase.kind === "notUrl" && (
          <p role="status" className="text-small text-ink-muted">
            {copy.editor.add.pasteNotUrl}
          </p>
        )}
        {phase.kind === "error" && <FormError message={phase.message} />}
        {phase.kind === "added" && (
          <p role="status" className="text-small text-success">
            {copy.editor.add.added}
          </p>
        )}
        {(phase.kind === "product" || phase.kind === "needsVariant") && (
          <ResolvedCard
            product={phase.product}
            priceAgorot={
              phase.kind === "product"
                ? phase.product.priceAgorot
                : (selectedVariant?.priceAgorot ?? null)
            }
            imageUrl={
              phase.kind === "needsVariant" && selectedVariant
                ? (selectedVariant.imageUrl ?? phase.product.imageUrl)
                : phase.product.imageUrl
            }
            variants={phase.kind === "needsVariant" ? variantList : null}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
            error={saveError}
            pending={saving}
            canSave={phase.kind === "product" || Boolean(selectedVariantId)}
            onSave={save}
          />
        )}
      </div>

      {!draftOpen && (
        <div className="flex gap-2">
          <Tab
            active={!showManual}
            onClick={() => {
              setOffer(null);
              if (tab !== "search") go({ tab: null });
            }}
          >
            {copy.editor.add.searchTab}
          </Tab>
          <Tab
            active={showManual}
            onClick={() => {
              if (tab !== "manual") go({ tab: "manual" });
            }}
          >
            {copy.editor.add.manualTab}
          </Tab>
        </div>
      )}

      {!draftOpen && (showManual ? (
        <div className="flex flex-col gap-4">
          {offer && (
            <div className="flex flex-col gap-2">
              <p className="text-small text-ink-muted">{offer.message}</p>
              {offer.detail && <p className="text-small text-ink-muted">{offer.detail}</p>}
              {offer.retryUrl && (
                <SecondaryButton
                  disabled={resolving || phase.kind === "pending"}
                  onClick={() => submit(offer.retryUrl!)}
                >
                  {copy.editor.add.pasteRetry}
                </SecondaryButton>
              )}
            </div>
          )}
          <ManualTab key={offer?.link ?? "manual"} initialLink={offer?.link ?? ""} />
        </div>
      ) : (
        <SearchTab
          page={page}
          query={query}
          category={category}
          onSearch={(q) => go({ q, page: null })}
          onCategory={(next) => go({ category: next })}
        />
      ))}
    </div>
  );
}

function ResolvedCard({
  product,
  priceAgorot,
  imageUrl,
  variants,
  selectedVariantId,
  onSelect,
  error,
  pending,
  canSave,
  onSave,
}: {
  product: CatalogResolvedProduct | CatalogResolvedNeedsVariant;
  priceAgorot: number | null;
  imageUrl: string | null;
  variants: CatalogResolveVariant[] | null;
  selectedVariantId: string | null;
  onSelect: (id: string) => void;
  error: string | null;
  pending: boolean;
  canSave: boolean;
  onSave: () => void;
}) {
  const headingId = useId();
  const title = product.title ?? "";
  const chain = product.chainNameHe?.trim() ? product.chainNameHe : null;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-btn bg-image-bg">
          <ItemImage
            src={imageUrl}
            alt={title}
            category={product.category}
            title={title}
            sizes="80px"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span dir="auto" className="line-clamp-2 text-small font-medium text-ink">
            {title}
          </span>
          <span className="flex items-center gap-2">
            {chain && <ShopChip name={chain} />}
            {priceAgorot !== null && (
              <span className="ms-auto">
                <Price agorot={priceAgorot} />
              </span>
            )}
          </span>
          <span className="text-tiny text-ink-muted">{copy.item.priceMayDiffer}</span>
          {product.canonicalUrl && (
            <ViewOnSiteLink href={product.canonicalUrl} chain={chain} />
          )}
        </span>
      </div>

      {variants && (
        <div role="group" aria-labelledby={headingId} className="flex flex-col gap-2">
          <p id={headingId} className="text-small font-medium text-ink">
            {copy.editor.add.pasteVariantHeading}
          </p>
          {variants.map((variant) => {
            const on = variant.id === selectedVariantId;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(variant.id)}
                className={`flex min-h-11 items-center gap-2 rounded-btn px-2.5 text-start ${
                  on ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
                }`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-btn bg-image-bg">
                  <ItemImage
                    src={variant.imageUrl}
                    alt={variant.label}
                    category={product.category}
                    title={variant.label}
                    sizes="40px"
                  />
                </span>
                <span dir="auto" className="min-w-0 flex-1 text-small">
                  {variant.label}
                </span>
                <Price agorot={variant.priceAgorot} />
              </button>
            );
          })}
        </div>
      )}

      <FormError message={error} />

      <PrimaryButton type="button" disabled={pending || !canSave} onClick={onSave}>
        {copy.editor.add.manualSubmit}
      </PrimaryButton>
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
        active ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink-muted"
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
          className="shrink-0 rounded-btn bg-primary px-4 text-small font-medium text-on-primary hover:bg-primary-hover active:bg-primary-active"
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
              className={`h-9 shrink-0 whitespace-nowrap rounded-btn px-3.5 text-small font-medium transition-colors ${
                on ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
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
    <li className="flex items-start gap-3 rounded-card border border-border bg-surface p-2.5">
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
        <ViewOnSiteLink href={result.canonicalUrl} chain={result.chainNameHe} />
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
          added ? "bg-success text-on-success" : "bg-primary text-on-primary"
        }`}
      >
        {added ? copy.editor.add.added : copy.editor.add.addThis}
      </button>
    </li>
  );
}

function ManualTab({ initialLink = "" }: { initialLink?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState(initialLink);
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
                className={`h-9 rounded-btn px-3.5 text-small font-medium transition-colors ${
                  on ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
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
