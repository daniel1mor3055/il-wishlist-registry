import { notFound } from "next/navigation";
import { MAIN_SLUG } from "@/app/page";
import { OgInspector } from "./OgInspector";

export default async function OgDevPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug = MAIN_SLUG } = await searchParams;
  return <OgInspector slug={slug} />;
}
