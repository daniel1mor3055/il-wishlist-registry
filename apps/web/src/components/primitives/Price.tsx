import { formatAgorot } from "@/lib/money";

/**
 * A price is an LTR run inside RTL text and an unbreakable token: the shekel
 * sign precedes the digits and the value never splits across a line, never
 * truncates (PRD section 8).
 */
export function Price({
  agorot,
  size = "body",
  muted = false,
}: {
  agorot: number;
  size?: "body" | "h3" | "h2";
  muted?: boolean;
}) {
  const sizeClass = size === "h2" ? "text-h2" : size === "h3" ? "text-h3" : "text-body";
  return (
    <span
      className={`ltr-token shrink-0 font-bold ${sizeClass} ${muted ? "text-muted" : "text-ink"}`}
    >
      {formatAgorot(agorot)}
    </span>
  );
}

/** An inline amount inside a Hebrew sentence, e.g. "נותרו ₪550 מתוך ₪1,290". */
export function InlineAmount({ agorot }: { agorot: number }) {
  return <span className="ltr-token">{formatAgorot(agorot)}</span>;
}
