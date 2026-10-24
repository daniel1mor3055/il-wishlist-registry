import { copy } from "@/lib/copy";

/** 12px track. The fill starts at the inline-start, the right edge in RTL. */
export function Meter({
  percent,
  tone = "accent",
  labelledBy,
}: {
  percent: number;
  tone?: "accent" | "success";
  labelledBy?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-pill bg-hairline"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={labelledBy ? undefined : copy.meter.name}
      aria-labelledby={labelledBy}
    >
      <div
        className={`h-full rounded-pill ${tone === "success" ? "bg-mint-ink" : "meter-fill"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
