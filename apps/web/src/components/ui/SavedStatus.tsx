import { Icon } from "@/components/ui/Sprite";

export function SavedStatus({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 text-fine font-medium text-mint-ink">
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-full bg-mint-wash"
      >
        <Icon name="ic-check" className="size-3.5" />
      </span>
      {children}
    </p>
  );
}
