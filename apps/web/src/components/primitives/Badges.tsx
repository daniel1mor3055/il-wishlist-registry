/** A neutral pill. Used for the chain mark and quantity counters. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "bordered" | "muted" | "primary";
}) {
  const tones = {
    neutral: "bg-neutral-tint text-ink-muted",
    bordered: "bg-neutral-tint text-ink-muted border border-border",
    muted: "bg-muted text-white",
    primary: "bg-primary text-white",
  } as const;
  return (
    <span
      className={`w-fit rounded-full px-2.5 py-0.5 text-micro font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** The chain the item comes from. Neutral by design: we are cross-chain (O3). */
export function ShopChip({ name }: { name: string }) {
  return <Pill tone="bordered">{name}</Pill>;
}
