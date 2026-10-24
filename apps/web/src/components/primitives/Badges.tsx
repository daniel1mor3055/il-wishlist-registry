import { Icon } from "@/components/ui/Sprite";

const tones = {
  neutral: "bg-paper font-semibold text-graphite shadow-lift-xs ring-1 ring-hairline",
  bordered: "bg-paper font-medium text-slate ring-1 ring-hairline",
  muted: "bg-charcoal font-medium text-snow",
  primary: "bg-brand-soft font-medium text-brand-deep",
} as const;

/** Count or status chip. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "bordered" | "muted" | "primary";
}) {
  return (
    <span
      className={`inline-flex h-6 w-fit items-center rounded-[6px] px-2 text-badge ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Chain mark stays slate: the list is cross-chain. */
export function ShopChip({ name }: { name: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 text-badge text-slate">
      <Icon name="ic-store" className="size-3.5" />
      {name}
    </span>
  );
}
