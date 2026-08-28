import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero, HowItWorks } from "@/components/registry/Hero";
import { RegistryClient } from "@/components/registry/RegistryClient";
import {
  ClosedRegistrySummary,
  RegistryShell,
} from "@/components/registry/RegistryShell";
import { getPublicRegistry } from "@/lib/api";
import { copy } from "@/lib/copy";
import { OG_HEIGHT, OG_WIDTH, ogImageUrl } from "@/lib/og";

type Props = { params: Promise<{ slug: string }> };

/**
 * The Open Graph card for the WhatsApp share, which the PRD calls the
 * highest-traffic surface in the product. This is the entire reason the web app
 * is server-rendered.
 *
 * A draft or closed registry must still return valid, non-error metadata, or
 * the preview dies and the link degrades to a bare URL.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const registry = await getPublicRegistry(slug);

  if (!registry) {
    return { title: copy.shell.notFound, robots: { index: false, follow: false } };
  }

  const title = copy.hero.titleFor(registry.coupleNames);
  const description =
    registry.lifecycle === "draft"
      ? copy.shell.notPublished
      : registry.lifecycle === "closed"
        ? copy.shell.closed
        : registry.story;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "he_IL",
      images: registry.coverImageUrl
        ? [ogImage(registry.coverImageUrl, title)]
        : undefined,
    },
  };
}

function ogImage(coverImageUrl: string, alt: string) {
  const { url, resized } = ogImageUrl(coverImageUrl);
  return resized ? { url, width: OG_WIDTH, height: OG_HEIGHT, alt } : { url, alt };
}

export default async function RegistryPage({ params }: Props) {
  const { slug } = await params;
  const registry = await getPublicRegistry(slug);

  if (!registry) notFound();

  if (registry.lifecycle === "draft") {
    return <RegistryShell message={copy.shell.notPublished} />;
  }

  if (registry.lifecycle === "closed") {
    return <ClosedRegistrySummary registry={registry} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg">
      <Hero registry={registry} />
      <HowItWorks />

      {registry.items.length > 0 && (
        <div className="px-5 pt-4">
          {/* An anchor, not a scroll handler: it works before hydration and
              costs no client JavaScript. */}
          <a
            href="#list"
            className="block w-full rounded-btn bg-primary py-3.5 text-center text-body font-medium text-white transition-opacity active:opacity-80"
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
