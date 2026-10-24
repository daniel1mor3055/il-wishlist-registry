export function G3ItemShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
      <svg className="absolute -bottom-10 -start-14 w-44 opacity-55 lg:-bottom-12 lg:-start-16 lg:w-60">
        <use href="#sh-flower" />
      </svg>
      <svg className="absolute -top-6 -end-12 w-40 opacity-45 lg:top-8 lg:-end-16 lg:w-56">
        <use href="#sh-arch" />
      </svg>
      <svg className="absolute top-14 start-5 w-7 opacity-70 lg:top-auto lg:bottom-24 lg:start-auto lg:end-8 lg:w-9">
        <use href="#sh-triangle" />
      </svg>
      <svg className="absolute bottom-6 end-8 hidden w-10 opacity-60 lg:block">
        <use href="#sh-circle" />
      </svg>
    </div>
  );
}
