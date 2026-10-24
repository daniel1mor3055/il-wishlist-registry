"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { addCatalogItem, addLinkItem, addManualItem, resolveCatalogLink } from "@/app/editor/actions";
import { C3PasteBrowser } from "@/components/illustrations/C3PasteBrowser";
import { ShopChip } from "@/components/primitives/Badges";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Price } from "@/components/primitives/Price";
import { Button } from "@/components/ui/Button";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { Icon, type IconName } from "@/components/ui/Sprite";
import { TextField } from "@/components/ui/TextField";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import type {
  CatalogPage,
  CatalogResolveVariant,
  CatalogResolvedNeedsVariant,
  CatalogResolvedProduct,
  CatalogResult,
  Category,
} from "@/lib/types";

/** Shop link is first. An unresolved read prefills the manual form (D59–D61). */

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
  const hintId = useId();
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

  const variantList = phase.kind === "needsVariant" ? (phase.product.variants ?? []) : [];
  const selectedVariant = variantList.find((one) => one.id === selectedVariantId) ?? null;
  const draftOpen = phase.kind === "product" || phase.kind === "needsVariant";
  const draftProduct =
    phase.kind === "product" || phase.kind === "needsVariant" ? phase.product : null;
  const draftImage = draftProduct
    ? phase.kind === "needsVariant" && selectedVariant
      ? (selectedVariant.imageUrl ?? draftProduct.imageUrl)
      : draftProduct.imageUrl
    : null;
  const looksLikeUrl = /https?:\/\/\S/i.test(text);
  const showHint = phase.kind === "idle" && !offer;

  return (
    <>
      <section
        className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[280px_minmax(0,1fr)]"
        aria-busy={phase.kind === "pending" || resolving || undefined}
      >
        <PasteArt
          imageUrl={draftImage}
          title={draftProduct?.title ?? ""}
          category={draftProduct?.category ?? null}
        />

        <div className="flex min-w-0 flex-col">
          <div className="px-5 pb-5 pt-5 lg:px-8 lg:pt-7">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit(text);
              }}
            >
              <label className="block text-start">
                <span className="block text-fine font-medium text-slate">
                  {copy.editor.add.pasteLabel}
                </span>
                <span className="relative mt-1.5 block">
                  <Icon
                    name="ic-link"
                    className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-brand-deep"
                  />
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
                      if (
                        phase.kind === "added" ||
                        phase.kind === "notUrl" ||
                        phase.kind === "error"
                      ) {
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
                    dir={looksLikeUrl ? "ltr" : "rtl"}
                    inputMode="url"
                    enterKeyHint="go"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={phase.kind === "notUrl" ? true : undefined}
                    aria-describedby={showHint ? hintId : undefined}
                    className={pasteInputClass(phase.kind === "notUrl", looksLikeUrl)}
                  />
                </span>
              </label>
            </form>

            {showHint ? (
              <p id={hintId} className="mt-2 text-fine text-slate">
                {copy.editor.add.pasteHint}
              </p>
            ) : null}

            {phase.kind === "pending" ? (
              <p role="status" className="mt-3 flex items-center gap-2 text-copy text-charcoal">
                <Spinner />
                {copy.editor.add.pastePending}
              </p>
            ) : null}
            {phase.kind === "notUrl" ? (
              <InlineAlert>
                <p className="font-medium">{copy.editor.add.pasteNotUrl}</p>
              </InlineAlert>
            ) : null}
            {phase.kind === "error" ? (
              <InlineAlert>
                <p className="font-medium">{phase.message}</p>
              </InlineAlert>
            ) : null}
            {phase.kind === "added" ? (
              <div className="mt-3">
                <SavedStatus>{copy.editor.add.added}</SavedStatus>
              </div>
            ) : null}
            {offer ? (
              <InlineAlert>
                <p className="font-medium">{offer.message}</p>
                {offer.detail ? <p className="mt-1">{offer.detail}</p> : null}
              </InlineAlert>
            ) : null}
            {offer?.retryUrl ? (
              <button
                type="button"
                disabled={resolving || phase.kind === "pending"}
                onClick={() => {
                  if (offer.retryUrl) submit(offer.retryUrl);
                }}
                className="press focus-ring mt-3 flex h-12 items-center rounded-pill bg-cloud px-6 text-copy font-medium text-charcoal hover:bg-hairline motion-safe:transition-colors disabled:opacity-50"
              >
                {copy.editor.add.pasteRetry}
              </button>
            ) : null}

            {draftProduct ? (
              <ResolvedBody
                product={draftProduct}
                priceAgorot={
                  phase.kind === "product"
                    ? phase.product.priceAgorot
                    : (selectedVariant?.priceAgorot ?? null)
                }
                variants={phase.kind === "needsVariant" ? variantList : null}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            ) : null}
          </div>

          {draftProduct ? (
            <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
              {saveError ? (
                <InlineAlert className="mb-3">
                  <p className="font-medium">{saveError}</p>
                </InlineAlert>
              ) : null}
              <Button
                type="button"
                disabled={saving || !(phase.kind === "product" || Boolean(selectedVariantId))}
                pending={saving}
                fit
                onClick={save}
              >
                {copy.editor.add.manualSubmit}
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {!draftOpen ? (
        <>
          <div className="mt-5 flex h-14 rounded-pill bg-paper p-1.5 shadow-lift-xs lg:mt-6 lg:max-w-[420px]">
            <Tab
              active={!showManual}
              icon="ic-store"
              onClick={() => {
                setOffer(null);
                if (tab !== "search") go({ tab: null });
              }}
            >
              {copy.editor.add.searchTab}
            </Tab>
            <Tab
              active={showManual}
              icon="ic-plus"
              onClick={() => {
                if (tab !== "manual") go({ tab: "manual" });
              }}
            >
              {copy.editor.add.manualTab}
            </Tab>
          </div>

          {showManual ? (
            <ManualTab key={offer?.link ?? "manual"} initialLink={offer?.link ?? ""} />
          ) : (
            <SearchTab
              page={page}
              query={query}
              category={category}
              onSearch={(q) => go({ q, page: null })}
              onCategory={(next) => go({ category: next })}
            />
          )}
        </>
      ) : null}
    </>
  );
}

function pasteInputClass(invalid: boolean, url: boolean): string {
  if (invalid) {
    return "focus-ring h-14 w-full rounded-tile border-2 border-alert bg-alert-wash ps-12 pe-4 text-copy text-graphite outline-none focus:bg-paper";
  }
  if (url) {
    return "ltr-token focus-ring h-14 w-full truncate rounded-tile bg-cloud pe-12 ps-4 text-fine text-graphite outline-none focus:bg-paper";
  }
  return "focus-ring h-14 w-full rounded-tile bg-cloud ps-12 pe-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper";
}

function PasteArt({
  imageUrl,
  title,
  category,
}: {
  imageUrl: string | null;
  title: string;
  category: Category | null;
}) {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid place-items-center overflow-hidden px-6 py-5 lg:py-8"
    >
      <div className="pointer-events-none absolute inset-0 fill-paper">
        <svg className="absolute -bottom-10 -start-12 w-36 opacity-55 lg:w-52">
          <use href="#sh-flower" />
        </svg>
        <svg className="absolute -top-6 -end-10 w-32 opacity-45 lg:top-4 lg:w-44">
          <use href="#sh-arch" />
        </svg>
        <svg className="absolute top-5 start-6 w-6 opacity-70 lg:top-auto lg:bottom-8 lg:start-auto lg:end-8 lg:w-8">
          <use href="#sh-triangle" />
        </svg>
      </div>
      {imageUrl ? (
        <span className="relative block">
          <span className="relative block size-36 overflow-hidden rounded-thumb bg-paper p-2 shadow-lift-md lg:size-52">
            <span className="relative block size-full">
              <ItemImage src={imageUrl} alt="" category={category} title={title} sizes="208px" />
            </span>
          </span>
          <Icon
            name="sh-burst"
            className="absolute -top-4 -end-4 size-12 rotate-12 fill-sticker drop-shadow-[0_6px_10px_color-mix(in_srgb,var(--color-charcoal)_18%,transparent)] lg:size-14"
          />
        </span>
      ) : (
        <C3PasteBrowser />
      )}
    </div>
  );
}

function ResolvedBody({
  product,
  priceAgorot,
  variants,
  selectedVariantId,
  onSelect,
}: {
  product: CatalogResolvedProduct | CatalogResolvedNeedsVariant;
  priceAgorot: number | null;
  variants: CatalogResolveVariant[] | null;
  selectedVariantId: string | null;
  onSelect: (id: string) => void;
}) {
  const headingId = useId();
  const title = product.title ?? "";
  const chain = product.chainNameHe?.trim() ? product.chainNameHe : null;

  return (
    <div className="mt-5">
      <h2 dir="auto" className="text-title font-medium text-graphite">
        {title}
      </h2>
      {chain || product.canonicalUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chain ? <ShopPill name={chain} /> : null}
          {product.canonicalUrl ? (
            <SiteLink href={product.canonicalUrl} chain={chain} />
          ) : null}
        </div>
      ) : null}
      {priceAgorot !== null ? (
        <div className="mt-3 rounded-tile bg-brand-softer px-4 py-3">
          <Price agorot={priceAgorot} size="h2" />
          <span className="mt-1.5 block text-fine text-slate">{copy.item.priceMayDiffer}</span>
        </div>
      ) : null}

      {variants ? (
        <div role="group" aria-labelledby={headingId} className="mt-5">
          <h3 id={headingId} className="text-fine font-medium text-slate">
            {copy.editor.add.pasteVariantHeading}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((variant) => {
              const on = variant.id === selectedVariantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(variant.id)}
                  className={`press focus-ring flex h-11 items-center gap-1.5 rounded-pill px-4 text-fine font-medium motion-safe:transition-colors ${
                    on
                      ? "bg-charcoal text-paper"
                      : "border border-hairline-strong bg-paper text-charcoal hover:bg-snow"
                  }`}
                >
                  {on ? <Icon name="ic-check" className="size-4" /> : null}
                  <span dir="auto">{variant.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Tab({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: IconName;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="press focus-ring flex flex-1 items-center justify-center gap-2 rounded-pill text-copy font-medium text-slate aria-pressed:bg-charcoal aria-pressed:text-paper aria-pressed:shadow-lift-xs motion-safe:transition-colors"
    >
      <Icon name={icon} className="size-5" />
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
    <section className="mt-4 rounded-sheet bg-paper shadow-lift-sm">
      <div className="px-4 pb-4 pt-5 lg:px-7 lg:pt-6">
        <form
          role="search"
          aria-label={copy.editor.add.search}
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(text.trim());
          }}
          className="flex items-center gap-2"
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{copy.editor.add.search}</span>
            <Icon
              name="ic-search"
              className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-slate"
            />
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={copy.editor.add.searchPlaceholder}
              className="focus-ring h-14 w-full rounded-pill bg-cloud ps-12 pe-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
            />
          </label>
          <button
            type="submit"
            className="press focus-ring flex h-14 shrink-0 items-center rounded-pill bg-brand-deep px-5 text-copy font-medium text-paper shadow-lift-sm hover:bg-brand-hover active:bg-brand-press motion-safe:transition-colors lg:px-8"
          >
            {copy.editor.add.search}
          </button>
        </form>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {CATEGORIES.map((one) => {
            const on = category === one;
            return (
              <ChoiceChip key={one} pressed={on} onClick={() => onCategory(on ? null : one)}>
                {CATEGORY_LABELS[one]}
              </ChoiceChip>
            );
          })}
        </div>
      </div>

      {page.results.length === 0 ? (
        <EmptyResults searched={Boolean(query || category)} />
      ) : (
        <div className="border-t border-hairline px-4 pb-4 pt-4 lg:px-7">
          <p className="text-fine font-medium text-slate">
            {copy.editor.add.resultCount(page.results.length, page.total)}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {page.results.map((result) => (
              <ResultRow key={result.id} result={result} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EmptyResults({ searched }: { searched: boolean }) {
  return (
    <div className="flex items-center gap-4 border-t border-hairline px-5 py-6 lg:px-7">
      {searched ? (
        <span
          aria-hidden="true"
          className="pastel-field grid size-14 shrink-0 place-items-center rounded-full text-brand-deep"
        >
          <Icon name="ic-search" className="size-7" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-sticker text-graphite"
        >
          <Icon name="ic-gift" className="size-7" />
        </span>
      )}
      <p className="text-copy text-charcoal">
        {searched ? copy.editor.add.noResults : copy.editor.add.browsePrompt}
      </p>
    </div>
  );
}

function ResultRow({ result }: { result: CatalogResult }) {
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-tile border border-hairline bg-paper p-3">
      <div className="flex items-center gap-3">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-thumb bg-cloud">
          <ItemImage
            src={result.imageUrl}
            alt=""
            category={result.category}
            title={result.title}
            sizes="64px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span dir="auto" className="clamp-2 block text-copy text-charcoal">
            {result.title}
          </span>
          <span className="mt-0.5 block">
            <ShopChip name={result.chainNameHe} />
          </span>
          <span className="mt-1 block">
            <Price agorot={result.priceAgorot} />
          </span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <SiteLink href={result.canonicalUrl} chain={result.chainNameHe} />
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
          className={
            added
              ? "flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-brand-soft px-4 text-fine font-medium text-brand-deep disabled:opacity-100"
              : "press focus-ring flex h-11 shrink-0 items-center rounded-pill bg-brand-deep px-4 text-fine font-medium text-paper disabled:opacity-60"
          }
        >
          {added ? <Icon name="ic-check" className="size-4" /> : null}
          {added ? copy.editor.add.added : copy.editor.add.addThis}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 flex items-center gap-2 text-fine font-medium text-alert-ink">
          <span
            aria-hidden="true"
            className="grid size-5 shrink-0 place-items-center rounded-full bg-alert text-badge text-paper"
          >
            !
          </span>
          {error}
        </p>
      ) : null}
    </li>
  );
}

function ManualTab({ initialLink = "" }: { initialLink?: string }) {
  const router = useRouter();
  const categoryLabelId = useId();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState(initialLink);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shekels = Number(price);
  const priceAgorot =
    price.trim() === "" || !Number.isFinite(shekels) ? null : Math.round(shekels * 100);
  const linkIsUrl = /https?:\/\/\S/i.test(link);

  return (
    <form
      className="mt-4 overflow-hidden rounded-sheet bg-paper shadow-lift-sm"
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
      <div className="grid gap-5 px-5 pb-6 pt-6 lg:grid-cols-2 lg:gap-x-5 lg:px-8 lg:pt-7">
        <div className="lg:col-span-2">
          <TextField
            label={copy.editor.add.manualTitleLabel}
            value={title}
            onChange={setTitle}
            placeholder={copy.editor.add.manualTitlePlaceholder}
          />
        </div>

        <label className="block text-start">
          <span className="block text-fine font-medium text-slate">
            {copy.editor.add.manualPriceLabel}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={copy.editor.add.manualPricePlaceholder}
            className="focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
          />
        </label>

        <label className="block text-start">
          <span className="block text-fine font-medium text-slate">
            {copy.editor.add.manualLinkLabel}
          </span>
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder={copy.editor.add.manualLinkPlaceholder}
            dir="ltr"
            inputMode="url"
            autoComplete="off"
            className={`ltr-token focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-graphite outline-none placeholder:text-slate focus:bg-paper ${
              linkIsUrl ? "truncate text-fine" : "text-copy"
            }`}
          />
        </label>

        <div className="lg:col-span-2">
          <p id={categoryLabelId} className="text-fine font-medium text-slate">
            {copy.editor.add.manualCategoryLabel}
          </p>
          <div
            role="group"
            aria-labelledby={categoryLabelId}
            className="mt-1.5 flex flex-wrap gap-2"
          >
            {CATEGORIES.map((one) => {
              const on = category === one;
              return (
                <ChoiceChip key={one} pressed={on} onClick={() => setCategory(on ? null : one)}>
                  {CATEGORY_LABELS[one]}
                </ChoiceChip>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
        {error ? (
          <InlineAlert className="mb-3">
            <p className="font-medium">{error}</p>
          </InlineAlert>
        ) : null}
        <Button type="submit" disabled={pending || title.trim().length < 2} pending={pending} fit>
          {copy.editor.add.manualSubmit}
        </Button>
      </div>
    </form>
  );
}

function ChoiceChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="press focus-ring flex h-11 shrink-0 items-center rounded-pill border border-hairline-strong bg-paper px-4 text-fine font-medium text-charcoal hover:bg-snow aria-pressed:border-transparent aria-pressed:bg-charcoal aria-pressed:text-paper motion-safe:transition-colors"
    >
      {children}
    </button>
  );
}

function ShopPill({ name }: { name: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-brand-softer px-3 text-fine font-medium text-charcoal">
      <Icon name="ic-store" className="size-4 text-brand-deep" />
      {name}
    </span>
  );
}

function SiteLink({ href, chain }: { href: string; chain: string | null }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring inline-flex h-11 items-center gap-1 text-fine font-medium text-brand-link hover:underline"
    >
      {copy.editor.viewOnSite(chain)}
      <Icon name="ic-external" className="size-4 shrink-0" />
    </a>
  );
}

function InlineAlert({ children, className = "mt-3" }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-tile bg-alert-wash px-4 py-3 text-fine text-alert-ink ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-alert font-medium text-paper"
      >
        !
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="spin size-5 text-brand-deep" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
      <path
        d="M12 4a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
