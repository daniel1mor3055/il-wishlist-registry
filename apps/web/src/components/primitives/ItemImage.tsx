"use client";

import Image from "next/image";
import { useState } from "react";
import type { Category } from "@/lib/types";

/**
 * Category glyphs for the broken-image placeholder.
 *
 * PRD section 7 is explicit: a broken image gets a branded 1:1 placeholder with
 * a category glyph and the product name. Never a grey box with alt text, and
 * never a layout shift.
 */
const GLYPHS: Record<Category, React.ReactNode> = {
  linens: (
    <>
      <path d="M10 26h44v22a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V26Z" />
      <path d="M10 26V18a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v8" />
      <path d="M22 26v-6h20v6" />
    </>
  ),
  feeding: (
    <>
      <path d="M26 14h12v6a6 6 0 0 1 4 5.6V50a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V25.6A6 6 0 0 1 26 20v-6Z" />
      <path d="M22 34h20" />
      <path d="M28 8h8" />
    </>
  ),
  mobility: (
    <>
      <path d="M12 20h26a14 14 0 0 1-14 14H12V20Z" />
      <path d="M12 20 8 12" />
      <path d="M38 20h14" />
      <circle cx="18" cy="46" r="5" />
      <circle cx="42" cy="46" r="5" />
    </>
  ),
  bath: (
    <>
      <path d="M8 30h48v8a12 12 0 0 1-12 12H20A12 12 0 0 1 8 38v-8Z" />
      <path d="M20 30V16a6 6 0 0 1 12 0" />
      <path d="M46 18v6" />
    </>
  ),
  clothing: (
    <>
      <path d="M24 12h16l10 8-6 8-2-2v26H22V26l-2 2-6-8 10-8Z" />
      <path d="M24 12a8 8 0 0 0 16 0" />
    </>
  ),
  toys: (
    <>
      <circle cx="32" cy="24" r="12" />
      <path d="M32 36v10" />
      <path d="M20 52h24" />
      <circle cx="32" cy="24" r="4" />
    </>
  ),
};

/** An item with no category still gets the branded placeholder, just no glyph:
    a manually added item may have nothing to classify it by. */
function Placeholder({ category, title }: { category: Category | null; title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-image-bg p-4">
      {category && (
        <svg
          width="52"
          height="52"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
          aria-hidden="true"
        >
          {GLYPHS[category]}
        </svg>
      )}
      <p className="line-clamp-2 text-center text-micro font-medium text-ink-muted">
        {title}
      </p>
    </div>
  );
}

export function ItemImage({
  src,
  alt,
  category,
  title,
  sizes = "(max-width: 640px) 50vw, 240px",
  priority = false,
  grayscale = false,
}: {
  src: string | null;
  alt: string;
  category: Category | null;
  title: string;
  sizes?: string;
  priority?: boolean;
  grayscale?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Placeholder category={category} title={title} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={`object-cover ${grayscale ? "grayscale" : ""}`}
    />
  );
}
