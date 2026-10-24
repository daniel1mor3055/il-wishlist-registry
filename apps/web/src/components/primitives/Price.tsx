import { formatAgorot } from "@/lib/money";

/** Shekel amount as one unbreakable LTR token. */
export function Price({
  agorot,
  size = "body",
}: {
  agorot: number;
  size?: "body" | "h3" | "h2";
}) {
  const sizeClass =
    size === "h2" ? "text-title" : size === "h3" ? "text-lg" : "text-copy";
  return (
    <span className={`ltr-token shrink-0 font-medium text-graphite ${sizeClass}`}>
      {formatAgorot(agorot)}
    </span>
  );
}

/** An inline amount inside a Hebrew sentence, e.g. "נותרו ₪550 מתוך ₪1,290". */
export function InlineAmount({ agorot }: { agorot: number }) {
  return <span className="ltr-token">{formatAgorot(agorot)}</span>;
}
