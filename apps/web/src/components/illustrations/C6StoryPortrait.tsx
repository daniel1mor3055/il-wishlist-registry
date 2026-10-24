export function C6StoryPortrait({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="pastel-field relative grid place-items-center overflow-hidden px-6 pb-6 pt-6 lg:items-start lg:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
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
      <div className="relative h-[220px] w-[184px] overflow-hidden rounded-[999px_999px_28px_28px] border-[6px] border-paper bg-paper shadow-lift-md lg:h-[330px] lg:w-[264px] lg:border-8">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- pasted cover URLs are not on the image allowlist
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <span aria-hidden="true" className="pastel-field grid size-full place-items-center">
            <span className="grid size-20 place-items-center rounded-full bg-paper text-brand-deep shadow-lift-sm lg:size-24">
              <svg className="size-10 fill-current lg:size-12" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#ic-heart" fill="currentColor" />
              </svg>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
