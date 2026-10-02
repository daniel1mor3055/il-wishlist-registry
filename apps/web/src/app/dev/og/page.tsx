import { notFound } from "next/navigation";
import { SEEDED_MAIN_SLUG } from "@/lib/fixtures";
import { OgInspector } from "./OgInspector";

export default async function OgDevPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug = SEEDED_MAIN_SLUG } = await searchParams;
  return <OgInspector slug={slug} />;
}
