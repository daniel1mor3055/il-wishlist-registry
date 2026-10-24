export function C6aGenderPreview() {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid place-items-center overflow-hidden px-6 py-6 lg:py-10"
    >
      <div className="pointer-events-none absolute inset-0 fill-paper">
        <svg className="absolute -bottom-10 -start-12 w-40 opacity-55 lg:w-56">
          <use href="#sh-flower" />
        </svg>
        <svg className="absolute -top-6 -end-10 w-32 opacity-45 lg:top-4 lg:w-44">
          <use href="#sh-arch" />
        </svg>
        <svg className="absolute bottom-6 end-6 w-7 opacity-70 lg:w-9">
          <use href="#sh-triangle" />
        </svg>
      </div>
      <div className="relative w-[216px] -rotate-2 rounded-thumb bg-paper p-2 shadow-lift-md lg:w-[236px]">
        <div className="band-field relative h-16 overflow-hidden rounded-[10px] px-3 pt-3">
          <svg className="absolute -top-3 -end-3 w-16 fill-paper opacity-25">
            <use href="#sh-arch" />
          </svg>
          <span className="block h-2 w-20 rounded-pill bg-paper/90" />
          <span className="mt-1.5 block h-1.5 w-12 rounded-pill bg-paper/60" />
          <svg className="wave-flip absolute start-0 end-0 -bottom-px h-3 w-full fill-paper">
            <use href="#wave" />
          </svg>
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-hairline p-1.5">
          <span className="pastel-field size-9 shrink-0 rounded-[6px]" />
          <span className="min-w-0 flex-1">
            <span className="block h-1.5 w-4/5 rounded-pill bg-hairline-strong" />
            <span className="mt-2 block h-1.5 overflow-hidden rounded-pill bg-hairline">
              <span className="meter-fill block h-full w-[57%] rounded-pill" />
            </span>
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-hairline p-1.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sticker text-graphite">
            <svg className="size-4">
              <use href="#ic-gift" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block h-1.5 w-3/5 rounded-pill bg-hairline-strong" />
            <span className="mt-2 block h-1.5 w-2/5 rounded-pill bg-brand-soft" />
          </span>
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-deep text-paper">
            <svg className="size-3.5">
              <use href="#ic-heart" fill="currentColor" />
            </svg>
          </span>
        </div>
        <span className="mt-2 block h-6 rounded-pill bg-brand-deep" />
      </div>
      <svg
        className="absolute end-[14%] top-[18%] size-10 fill-sticker lg:top-[16%]"
        viewBox="0 0 24 24"
      >
        <use href="#ic-heart" />
      </svg>
    </div>
  );
}
