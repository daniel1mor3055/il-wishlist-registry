import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero, HowItWorks } from "@/components/registry/Hero";
import { RegistryClient } from "@/components/registry/RegistryClient";
import { ClosedRegistrySummary } from "@/components/registry/RegistryShell";
import { getPublicRegistry } from "@/lib/api";
import { copy } from "@/lib/copy";
import { DEFAULT_COVER_PATH, coverIsCustom, coverSrc } from "@/lib/cover";
import { OG_HEIGHT, OG_WIDTH, ogImageUrl } from "@/lib/og";
import { themeFromGender } from "@/lib/theme";

type Props = { params: Promise<{ slug: string }> };

/**
 * The Open Graph card for the WhatsApp share, which the PRD calls the
 * highest-traffic surface in the product. This is the entire reason the web app
 * is server-rendered.
 *
 * A closed registry must still return valid, non-error metadata, or the preview
 * dies and the link degrades to a bare URL. An unpublished one is not a case
 * here at all: it never resolves (D30).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const registry = await getPublicRegistry(slug);

  if (!registry) {
    return { title: copy.shell.notFound, robots: { index: false, follow: false } };
  }

  const title = copy.hero.titleFor(registry.coupleNames);
  const description =
    registry.lifecycle === "closed" ? copy.shell.closed : registry.story;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "he_IL",
      images: [
        ogCover(
          registry.coverImageUrl,
          coverIsCustom(registry.coverImageUrl) ? title : copy.hero.defaultCoverAlt,
        ),
      ],
    },
  };
}

function ogCover(url: string | null, alt: string) {
  const src = coverSrc(url);
  if (src === DEFAULT_COVER_PATH) {
    return { url: src, width: OG_WIDTH, height: OG_HEIGHT, alt };
  }
  const { url: sized, resized } = ogImageUrl(src);
  return resized
    ? { url: sized, width: OG_WIDTH, height: OG_HEIGHT, alt }
    : { url: src, alt };
}

export default async function RegistryPage({ params }: Props) {
  const { slug } = await params;
  const registry = await getPublicRegistry(slug);

  if (!registry) notFound();

  const theme = themeFromGender(registry.babyGender);
  if (registry.lifecycle === "closed") {
    return (
      <div data-theme={theme}>
        <ClosedRegistrySummary registry={registry} />
      </div>
    );
  }

  return (
    <main data-theme={theme} className="paper-wash mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <Hero registry={registry} />
      <HowItWorks />

      {registry.items.length > 0 && (
        <div className="px-5 pt-4">
          {/* An anchor, not a scroll handler: it works before hydration and
              costs no client JavaScript. */}
          <a
            href="#list"
            className="block w-full rounded-btn bg-primary py-3.5 text-center text-body font-medium text-on-primary hover:bg-primary-hover active:bg-primary-active"
          >
            {copy.hero.cta}
          </a>
        </div>
      )}

      <div id="list" className="scroll-mt-0" />
      <RegistryClient registry={registry} />
    </main>
  );
}
