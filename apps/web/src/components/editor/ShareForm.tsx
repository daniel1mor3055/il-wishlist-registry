"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Field, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton, SecondaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

function guestPath(slug: string) {
  return `/r/${slug}`;
}

function defaultMessage(url: string) {
  return `${copy.editor.share.defaultMessage}\n${url}`;
}

function whatsappHref(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Post-publish share kit. The preview card is a WhatsApp-shaped mock of the
 * names, story and cover — not a live crawler of the guest page's OG tags.
 */
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
  const [origin, setOrigin] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const path = guestPath(slug);
  const absolute = origin ? `${origin}${path}` : "";
  const ready = absolute.startsWith("http");
  const hostname = origin ? new URL(origin).host : "";

  useEffect(() => {
    const next = window.location.origin;
    setOrigin(next);
    setMessage(defaultMessage(`${next}${path}`));
  }, [path]);

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
    <div className="flex flex-1 flex-col gap-5">
      <p className="text-small text-ink-muted">{copy.editor.share.body}</p>

      <Field label={copy.editor.share.messageLabel}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <p className="text-small font-medium text-ink">{copy.editor.share.previewLabel}</p>
        <PreviewCard
          coupleNames={coupleNames}
          story={story}
          coverImageUrl={coverImageUrl}
          hostname={hostname}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-small font-medium text-ink">{copy.editor.share.qrLabel}</p>
        <p className="text-tiny text-ink-muted">{copy.editor.share.qrHint}</p>
        <div className="flex justify-center rounded-card border border-border bg-surface p-4">
          {qrSrc ? (
            // QR is a generated data URL, not a remote asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt={copy.editor.share.qrLabel} className="h-44 w-44" />
          ) : (
            <div className="h-44 w-44 rounded-btn bg-image-bg" />
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <PrimaryButton
          disabled={!ready || !message.trim()}
          onClick={() => {
            window.open(whatsappHref(message), "_blank", "noopener,noreferrer");
          }}
        >
          {copy.editor.share.whatsapp}
        </PrimaryButton>
        <SecondaryButton
          disabled={!ready}
          onClick={() => {
            void navigator.clipboard?.writeText(absolute).catch(() => {});
            setCopied(true);
          }}
        >
          {copied ? copy.editor.share.copiedLink : copy.editor.share.copyLink}
        </SecondaryButton>
      </div>
    </div>
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
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="relative aspect-[1200/630] w-full bg-image-bg">
        {coverImageUrl ? (
          // Arbitrary pasted URLs are not on the Next image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <p className="text-tiny text-ink-muted">{copy.editor.share.previewFallback}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <p className="line-clamp-2 text-small font-medium text-ink">
          {copy.hero.titleFor(coupleNames)}
        </p>
        {line && <p className="line-clamp-2 text-tiny text-ink-muted">{line}</p>}
        {hostname && (
          <p className="truncate text-micro text-muted">
            <span className="ltr-token">{hostname}</span>
          </p>
        )}
      </div>
    </div>
  );
}
