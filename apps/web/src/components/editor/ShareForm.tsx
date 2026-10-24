"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Sprite";
import { TextArea } from "@/components/ui/TextArea";
import { copy } from "@/lib/copy";
import { coverSrc } from "@/lib/cover";

function guestPath(slug: string) {
  return `/r/${slug}`;
}

function defaultMessage(url: string) {
  return `${copy.editor.share.defaultMessage}\n${url}`;
}

function whatsappHref(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function subscribeOrigin() {
  return () => {};
}

function getOriginSnapshot() {
  return window.location.origin;
}

function getOriginServerSnapshot() {
  return "";
}

/** WhatsApp-shaped preview of the names, story and cover — not a live OG crawl. */
export function ShareForm({
  slug,
  coupleNames,
  story,
  coverImageUrl,
}: {
  slug: string;
  coupleNames: string;
  story: string;
  coverImageUrl: string | null;
}) {
  const origin = useSyncExternalStore(
    subscribeOrigin,
    getOriginSnapshot,
    getOriginServerSnapshot,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const path = guestPath(slug);
  const absolute = origin ? `${origin}${path}` : "";
  const displayedMessage = message ?? (absolute ? defaultMessage(absolute) : "");
  const ready = absolute.startsWith("http");
  const hostname = origin ? new URL(origin).host : "";

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void QRCode.toDataURL(absolute, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (!cancelled) setQrSrc(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [absolute, ready]);

  return (
    <>
      <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md">
        <div className="px-5 pb-6 pt-5 lg:px-8 lg:pt-8">
          <p className="text-copy text-charcoal lg:text-lead">{copy.editor.share.body}</p>

          <div className="mt-6">
            <TextArea
              label={copy.editor.share.messageLabel}
              value={displayedMessage}
              rows={3}
              onChange={setMessage}
            />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-pill bg-brand-softer py-1 pe-1 ps-4">
            <Icon name="ic-link" className="size-5 shrink-0 text-brand-deep" />
            <span className="ltr-token min-w-0 flex-1 truncate text-fine text-graphite">
              {absolute || path}
            </span>
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                void navigator.clipboard?.writeText(absolute).catch(() => {});
                setCopied(true);
              }}
              className={`press focus-ring flex h-11 shrink-0 items-center gap-1.5 rounded-pill bg-paper px-4 text-fine font-medium shadow-lift-xs hover:bg-cloud motion-safe:transition-colors disabled:opacity-30 ${
                copied ? "text-mint-ink" : "text-brand-deep"
              }`}
            >
              <Icon name={copied ? "ic-check" : "ic-copy"} className="size-4" />
              {copied ? copy.editor.share.copiedLink : copy.editor.share.copyLink}
            </button>
          </div>
        </div>
        <div className="border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
          <Button
            type="button"
            fit
            disabled={!ready || !displayedMessage.trim()}
            onClick={() => {
              window.open(whatsappHref(displayedMessage), "_blank", "noopener,noreferrer");
            }}
          >
            <Icon name="ic-chat" className="size-5" />
            {copy.editor.share.whatsapp}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-sheet bg-paper p-5 shadow-lift-sm lg:p-6"
          aria-labelledby="share-preview-label"
        >
          <h2 id="share-preview-label" className="text-lead font-medium text-graphite">
            {copy.editor.share.previewLabel}
          </h2>
          <PreviewCard
            coupleNames={coupleNames}
            story={story}
            coverImageUrl={coverImageUrl}
            hostname={hostname}
          />
        </section>

        <figure className="pastel-field relative overflow-hidden rounded-sheet px-5 pb-6 pt-6 text-center shadow-lift-sm lg:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
            <Icon name="sh-flower" className="absolute -bottom-12 -start-10 w-40 opacity-55" />
            <Icon name="sh-arch" className="absolute -top-6 -end-12 w-40 opacity-45" />
            <Icon name="sh-triangle" className="absolute top-8 start-6 w-7 opacity-70" />
            <Icon name="sh-circle" className="absolute bottom-24 end-6 w-10 opacity-60" />
          </div>
          <div className="relative mx-auto grid size-60 place-items-center">
            <Icon name="sh-burst" className="absolute inset-0 size-full fill-paper" />
            {qrSrc ? (
              // QR is a generated data URL, not a remote asset.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt={copy.editor.share.qrLabel} className="relative size-32" />
            ) : (
              <div className="relative size-32 rounded-tile bg-paper/70" />
            )}
            <Icon
              name="ic-heart"
              className="absolute -top-1 end-3 size-10 rotate-12 fill-sticker"
            />
          </div>
          <figcaption className="relative mt-3">
            <span className="block text-title font-medium text-graphite">
              {copy.editor.share.qrLabel}
            </span>
            <span className="mx-auto mt-1.5 block max-w-[22rem] text-fine text-charcoal">
              {copy.editor.share.qrHint}
            </span>
          </figcaption>
        </figure>
      </div>
    </>
  );
}

function PreviewCard({
  coupleNames,
  story,
  coverImageUrl,
  hostname,
}: {
  coupleNames: string;
  story: string;
  coverImageUrl: string | null;
  hostname: string;
}) {
  const line = story.trim();

  return (
    <div className="mt-4 rounded-tile bg-cloud p-4">
      <article className="ms-auto max-w-[300px] rounded-[18px] rounded-se-md bg-paper p-1.5 shadow-lift-xs">
        <div className="overflow-hidden rounded-[13px] bg-snow">
          {/* Arbitrary pasted URLs are not on the Next image allowlist. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc(coverImageUrl)}
            alt=""
            className="aspect-[1.91/1] w-full object-cover object-center"
          />
          <div className="px-3 pb-3 pt-2.5">
            <p className="text-copy font-medium text-graphite">
              {copy.hero.titleFor(coupleNames)}
            </p>
            {line && <p className="clamp-2 mt-1 text-badge text-charcoal">{line}</p>}
            {hostname && (
              <p className="ltr-token mt-2 truncate text-badge text-slate">{hostname}</p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
