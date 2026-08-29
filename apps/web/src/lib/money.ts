/**
 * Money is stored and transported as integer agorot, and formatted in exactly
 * one place. The shekel sign precedes the digits, thousands are grouped, and
 * the result is always wrapped in `.ltr-token` at the call site so it cannot
 * break across a line (PRD section 8).
 */

const whole = new Intl.NumberFormat("en-US", { useGrouping: true });
const fractional = new Intl.NumberFormat("en-US", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * 439000 -> "₪4,390", 330670 -> "₪3,306.70".
 *
 * Real retailer prices carry agorot (sale prices land on .90 and .92), so the
 * fractional case is not hypothetical. Both cases group thousands: dropping the
 * separator on the decimal path made ₪3,306.70 render as ₪3306.70.
 */
export function formatAgorot(agorot: number): string {
  const shekels = agorot / 100;
  const formatted = Number.isInteger(shekels)
    ? whole.format(shekels)
    : fractional.format(shekels);
  return `₪${formatted}`;
}

/**
 * Fraction still outstanding, as a percentage of the target.
 *
 * The reference render hardcoded `(1 - 550/1290) * 100`, which would have lied
 * the moment real data arrived. The meter fills to show progress made, so this
 * returns the contributed share.
 */
export function fundedPercent(
  contributedAgorot: number,
  targetAgorot: number | null,
): number {
  if (!targetAgorot || targetAgorot <= 0) return 0;
  const pct = (contributedAgorot / targetAgorot) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function remainingAgorot(
  contributedAgorot: number,
  targetAgorot: number | null,
): number {
  if (!targetAgorot) return 0;
  return Math.max(0, targetAgorot - contributedAgorot);
}

export function isFundComplete(
  contributedAgorot: number,
  targetAgorot: number | null,
): boolean {
  if (!targetAgorot || targetAgorot <= 0) return false;
  return contributedAgorot >= targetAgorot;
}

/** Suggested contribution chips, derived from what is actually still needed. */
export function suggestedAmounts(remaining: number): number[] {
  const candidates = [5_000, 10_000, 20_000, 50_000];
  const usable = candidates.filter((c) => c <= Math.max(remaining, 5_000));
  return usable.length > 0 ? usable.slice(0, 3) : [5_000, 10_000, 20_000];
}

/**
 * The envelope's chips are fixed, because an envelope has no target to derive
 * them from (D28). ₪50 / ₪100 / ₪200, plus "סכום אחר" at the call site.
 */
export const ENVELOPE_AMOUNTS = [5_000, 10_000, 20_000];
