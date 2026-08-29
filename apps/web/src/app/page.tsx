import Link from "next/link";
import { mainRegistry } from "@/lib/fixtures/registries";
import { listFixtureSlugs } from "@/lib/api";

const DESCRIPTIONS: Record<string, string> = {
  "noa-itai-k4m2xq8vp3wt": "הרשימה הראשית — פורסמה, חלקית נתפסה",
  "empty-registry-demo": "רשימה ריקה",
  "single-item-demo": "פריט אחד בלבד",
  "fully-claimed-demo": "כל הפריטים נתפסו",
  "closed-demo": "נסגרה",
};

/**
 * A development index. Not a product surface: the real entry point is a shared
 * registry link, and there is no public discoverability by design (PRD 10).
 */
export default function DevIndex() {
  const slugs = listFixtureSlugs();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-ink">רשימת לידה — POC</h1>
        <p className="text-small text-ink-muted">
          C1: שלד, ניווט וזהות חזותית. הנתונים אמיתיים, נאספו מהחנויות.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-h3 font-bold text-ink">רשימות לדוגמה</h2>
        {slugs.map((slug) => (
          <Link
            key={slug}
            href={`/r/${slug}`}
            className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:bg-panel"
          >
            <span className="text-small text-ink">{DESCRIPTIONS[slug] ?? slug}</span>
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
        <span className="ltr-token">{mainRegistry.items.length}</span> פריטים ברשימה
        הראשית · קטלוג אמיתי מ־<span className="ltr-token">4</span> חנויות
      </footer>
    </main>
  );
}
