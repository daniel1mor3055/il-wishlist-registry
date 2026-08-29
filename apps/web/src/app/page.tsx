import Link from "next/link";
import { getPublicRegistry } from "@/lib/api";

/**
 * A development index. Not a product surface: the real entry point is a shared
 * registry link, and there is no public discoverability by design (PRD 10).
 *
 * The slugs are listed here rather than fetched, because there is no endpoint
 * that enumerates registries and there should not be one.
 */
export const MAIN_SLUG = "noa-itai-k4m2xq8vp3wt";

const DEMO_REGISTRIES: Array<{ slug: string; description: string }> = [
  { slug: MAIN_SLUG, description: "הרשימה הראשית — פורסמה, חלקית נתפסה" },
  { slug: "empty-registry-demo", description: "רשימה ריקה" },
  { slug: "single-item-demo", description: "פריט אחד בלבד" },
  { slug: "fully-claimed-demo", description: "כל הפריטים נתפסו" },
  { slug: "closed-demo", description: "נסגרה" },
];

export default async function DevIndex() {
  const main = await getPublicRegistry(MAIN_SLUG).catch(() => null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-ink">רשימת לידה — POC</h1>
        <p className="text-small text-ink-muted">
          C2: הנתונים נקראים מה־API מעל Postgres. הקטלוג אמיתי, נאסף מהחנויות.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-h3 font-bold text-ink">רשימות לדוגמה</h2>
        {DEMO_REGISTRIES.map(({ slug, description }) => (
          <Link
            key={slug}
            href={`/r/${slug}`}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:bg-panel"
          >
            <span className="text-small text-ink">{description}</span>
            <code className="ltr-token text-micro text-ink-muted">/r/{slug}</code>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-h3 font-bold text-ink">כלי פיתוח</h2>
        <Link
          href="/dev/states"
          className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:bg-panel"
        >
          <span className="text-small text-ink">גלריית המצבים — כל מצבי ה־PRD</span>
          <code className="ltr-token text-micro text-ink-muted">/dev/states</code>
        </Link>
      </section>

      <footer className="text-tiny text-ink-muted">
        {main ? (
          <>
            <span className="ltr-token">{main.items.length}</span> פריטים ברשימה הראשית ·
            קטלוג אמיתי מ־<span className="ltr-token">4</span> חנויות
          </>
        ) : (
          <>
            ה־API לא זמין. הרצה:{" "}
            <code className="ltr-token" dir="ltr">
              npm run services:up &amp;&amp; npm run seed
            </code>
          </>
        )}
      </footer>
    </main>
  );
}
