"use client";

import { useEffect, useState } from "react";

type OgTags = {
  title: string | null;
  description: string | null;
  image: string | null;
};

function meta(html: string, property: string): string | null {
  const escaped = property.replace(":", "\\:");
  const named = html.match(
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
  );
  if (named?.[1]) return named[1];
  const reversed = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${escaped}["']`,
      "i",
    ),
  );
  return reversed?.[1] ?? null;
}

/**
 * Dev-only: fetch the guest HTML and show the OG tags the crawler would see.
 */
export function OgInspector({ slug }: { slug: string }) {
  const [tags, setTags] = useState<OgTags | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/r/${slug}`)
      .then(async (response) => {
        const html = await response.text();
        if (cancelled) return;
        if (!response.ok) {
          setMissing(true);
          setTags(null);
          return;
        }
        setMissing(false);
        setTags({
          title: meta(html, "og:title"),
          description: meta(html, "og:description"),
          image: meta(html, "og:image"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-4 px-4 py-8">
      <h1 className="text-h3 font-bold text-ink">og:{slug}</h1>
      {missing && <p className="text-small text-ink-muted">הרשימה לא נמצאה</p>}
      {tags && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="relative aspect-[1200/630] w-full bg-image-bg">
            {tags.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tags.image} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-2.5">
            <p className="line-clamp-2 text-small font-medium text-ink">{tags.title}</p>
            {tags.description && (
              <p className="line-clamp-2 text-tiny text-ink-muted">{tags.description}</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
