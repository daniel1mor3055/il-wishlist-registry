/**
 * A funding or progress meter.
 *
 * PRD section 8: meters fill right to left, flush to the right edge. The
 * reference render achieved this with `right-0`, which is right by accident -
 * correct only because RTL happens to make right the inline start. This uses
 * the logical property, so it expresses the intent rather than the coincidence.
 */
export function Meter({
  percent,
  tone = "accent",
}: {
  percent: number;
  tone?: "accent" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-meter-track"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`absolute inset-y-0 start-0 rounded-full ${
          tone === "success" ? "bg-success" : "bg-accent"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
