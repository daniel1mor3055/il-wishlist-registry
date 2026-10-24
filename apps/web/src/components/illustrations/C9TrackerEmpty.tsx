import { Icon } from "@/components/ui/Sprite";

export function C9TrackerEmpty() {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid h-36 place-items-center overflow-hidden lg:h-44"
    >
      <svg className="absolute -bottom-10 -start-8 w-32 fill-paper opacity-55">
        <use href="#sh-flower" />
      </svg>
      <svg className="absolute -top-6 -end-8 w-32 fill-paper opacity-45">
        <use href="#sh-arch" />
      </svg>
      <span className="relative grid size-20 -rotate-6 place-items-center">
        <svg className="absolute inset-0 size-full fill-sticker drop-shadow-[0_3px_0_color-mix(in_srgb,var(--color-graphite)_18%,transparent)]">
          <use href="#sh-burst" />
        </svg>
        <Icon name="ic-gift" className="relative size-9 text-graphite" />
      </span>
    </div>
  );
}
