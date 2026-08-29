"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addEnvelope, publishRegistry } from "@/app/editor/actions";
import { FormError } from "@/components/editor/EditorShell";
import { Pill } from "@/components/primitives/Badges";
import { PrimaryButton, SecondaryButton } from "@/components/primitives/Buttons";
import { ItemImage } from "@/components/primitives/ItemImage";
import { copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type { OwnerItem, OwnerRegistry } from "@/lib/types";

/**
 * What this screen is given, which is less than the couple's registry holds.
 *
 * A client component's props are serialised into the page, so the payment handle
 * would travel to the browser inside a screen that never shows it. Narrowing the
 * prop is how that stays true as the screen grows.
 */
export type EditorHomeView = Pick<
  OwnerRegistry,
  "slug" | "coupleNames" | "publishedAt" | "itemsTotal" | "itemsClaimed" | "items"
>;

/**
 * The editor's home screen (PRD ed-C2).
 *
 * Reordering by drag is not here yet - it arrives with the tracker checkpoint,
 * and a fake handle would be worse than none.
 *
 * The unpublished banner is the only surface in the product that names an
 * unpublished list, and it names it to its owner (D30). A guest holding the link
 * gets "not found", which is why the banner says the link will not work yet.
 */
export function EditorHome({ registry }: { registry: EditorHomeView }) {
  const published = registry.publishedAt !== null;
  const active = registry.items.filter((item) => item.isActive);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-h3 font-bold text-ink">{registry.coupleNames}</p>
        <p className="text-small text-ink-muted">
          {copy.editor.home.itemCount(active.length)}
          {registry.itemsTotal > 0 && (
            <>
              {" · "}
              {copy.editor.home.claimed(registry.itemsClaimed, registry.itemsTotal)}
            </>
          )}
        </p>
      </div>

      {published ? (
        <ShareCard slug={registry.slug} />
      ) : (
        <PublishCard itemCount={active.length} />
      )}

      <div className="flex flex-col gap-2">
        <Link
          href="/editor/add"
          className="block w-full rounded-btn bg-primary py-3.5 text-center text-body font-medium text-white transition-opacity active:opacity-80"
        >
          {copy.editor.home.addItem}
        </Link>
        {!registry.items.some((item) => item.kind === "fund") && <AddEnvelopeButton />}
        {published && (
          <Link
            href={`/r/${registry.slug}`}
            className="block py-1 text-center text-small font-medium text-ink-muted transition-opacity active:opacity-70"
          >
            {copy.editor.home.preview}
          </Link>
        )}
        <Link
          href="/editor/address"
          className="block py-1 text-center text-small font-medium text-ink-muted transition-opacity active:opacity-70"
        >
          {copy.editor.home.address}
        </Link>
      </div>

      {active.length === 0 ? (
        <EmptyList />
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyList() {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface p-4 text-center">
      <p className="text-body font-medium text-ink">{copy.editor.home.emptyTitle}</p>
      <p className="text-small text-ink-muted">{copy.editor.home.emptyBody}</p>
    </div>
  );
}

function ItemRow({ item }: { item: OwnerItem }) {
  const taken = item.claimState !== "available";

  return (
    <li>
      <Link
        href={`/editor/items/${item.id}`}
        className="flex items-center gap-3 rounded-card border border-border bg-surface p-2.5 text-right transition-transform active:scale-[0.99]"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-image-bg">
          {item.kind === "product" ? (
            <ItemImage
              src={item.imageUrl}
              alt={item.title}
              category={item.category}
              title={item.title}
              grayscale={taken}
              sizes="56px"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-body">💛</span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-1 text-small font-medium text-ink">
            {item.title}
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {item.priceAgorot !== null && (
              <span className="text-tiny text-ink-muted">
                <span className="ltr-token">{formatAgorot(item.priceAgorot)}</span>
              </span>
            )}
            {item.quantityWanted > 1 && (
              <span className="text-tiny text-ink-muted">× {item.quantityWanted}</span>
            )}
            {taken && <Pill tone="muted">{copy.editor.home.itemTaken}</Pill>}
            {item.groupGiftEnabled && (
              <Pill tone="primary">{copy.editor.home.itemGroupGift}</Pill>
            )}
            {item.contributedAgorot > 0 && (
              <span className="text-tiny text-ink-muted">
                {copy.editor.home.itemContributed(formatAgorot(item.contributedAgorot))}
              </span>
            )}
          </span>
        </span>

        <span className="shrink-0 text-tiny font-medium text-primary">
          {copy.editor.home.settings}
        </span>
      </Link>
    </li>
  );
}

function PublishCard({ itemCount }: { itemCount: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-accent bg-accent-tint p-4">
      <p className="text-body font-bold text-ink">{copy.editor.home.unpublishedTitle}</p>
      <p className="text-small text-accent-ink">{copy.editor.home.unpublishedBody}</p>
      <FormError message={error} />
      <PrimaryButton
        disabled={pending || itemCount === 0}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await publishRegistry();
            if (!result.ok) setError(result.error);
          })
        }
      >
        {pending ? copy.editor.home.publishing : copy.editor.home.publish}
      </PrimaryButton>
    </div>
  );
}

/**
 * The link, and a copy button.
 *
 * The full share screen - WhatsApp, QR, the Open Graph preview - is its own
 * checkpoint. What a couple needs the moment they publish is the URL, so that is
 * what this shows.
 */
function ShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `/r/${slug}`;

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
        <p className="text-body font-bold text-ink">{copy.editor.home.publishedTitle}</p>
      </div>

      <p className="text-tiny text-ink-muted">{copy.editor.home.linkLabel}</p>
      <p className="truncate rounded-btn bg-panel px-3 py-2 text-small text-ink">
        <span className="ltr-token">{url}</span>
      </p>

      <SecondaryButton
        onClick={() => {
          const absolute = `${window.location.origin}${url}`;
          void navigator.clipboard?.writeText(absolute);
          setCopied(true);
        }}
      >
        {copied ? copy.editor.home.copiedLink : copy.editor.home.copyLink}
      </SecondaryButton>
    </div>
  );
}

function AddEnvelopeButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <SecondaryButton
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await addEnvelope();
            if (!result.ok) setError(result.error);
          })
        }
      >
        {copy.editor.home.addEnvelope}
      </SecondaryButton>
      <FormError message={error} />
    </>
  );
}
