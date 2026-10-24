import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";

const backClassName =
  "press -ms-1.5 grid size-11 shrink-0 place-items-center rounded-full bg-paper/15 text-paper outline-none hover:bg-paper/25 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-paper motion-safe:transition-colors lg:mt-1.5 lg:size-12";

export type EditorNavKey = "home" | "add" | "tracker" | "share" | "preview" | "settings";

const NAV: {
  key: EditorNavKey;
  href: string;
  label: string;
  icon: IconName;
  sticker?: boolean;
}[] = [
  { key: "home", href: "/editor", label: copy.editor.home.title, icon: "ic-list" },
  { key: "add", href: "/editor/add", label: copy.editor.home.addItem, icon: "ic-plus" },
  {
    key: "tracker",
    href: "/editor/tracker",
    label: copy.editor.tracker.title,
    icon: "ic-gift",
    sticker: true,
  },
  { key: "share", href: "/editor/share", label: copy.editor.share.title, icon: "ic-share" },
  { key: "preview", href: "/editor/preview", label: copy.editor.home.preview, icon: "ic-eye" },
  { key: "settings", href: "/editor/settings", label: copy.editor.settings.title, icon: "ic-gear" },
];

function BackChevron() {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 6l6 6-6 6" />
    </svg>
  );
}

function EditorSideNav({ current }: { current: EditorNavKey }) {
  // display:none below lg so these names are not in the mobile accessibility tree.
  return (
    <nav className="hidden lg:sticky lg:top-24 lg:order-2 lg:-mt-28 lg:block">
      <ul className="flex flex-col gap-0.5 rounded-sheet border border-hairline bg-paper p-2 shadow-lift-sm">
        {NAV.map((item) => {
          const active = item.key === current;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "press focus-ring flex h-12 items-center gap-3 rounded-tile bg-brand-soft px-2.5 text-copy font-medium text-brand-deep"
                    : "press focus-ring flex h-12 items-center gap-3 rounded-tile px-2.5 text-copy text-charcoal hover:bg-cloud motion-safe:transition-colors"
                }
              >
                <span
                  aria-hidden="true"
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${
                    item.sticker
                      ? "bg-sticker text-graphite"
                      : active
                        ? "bg-paper text-brand-deep"
                        : "bg-brand-softer text-brand-deep"
                  }`}
                >
                  <Icon name={item.icon} className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function EditorFrame({
  title,
  back,
  onBack,
  backDisabled = false,
  lead,
  illustration,
  eyebrow,
  wide = false,
  nav,
  children,
}: {
  title: string;
  /** A route, not a history pop: these screens are linkable. */
  back?: string;
  onBack?: () => void;
  backDisabled?: boolean;
  lead?: React.ReactNode;
  illustration?: React.ReactNode;
  eyebrow?: React.ReactNode;
  wide?: boolean;
  nav?: EditorNavKey;
  children: React.ReactNode;
}) {
  const compact = illustration != null;
  const openBanner = !compact && eyebrow != null;

  const titleBlock = (
    <>
      {eyebrow}
      <h1
        className={
          compact
            ? eyebrow
              ? "mt-1 text-[30px] font-medium leading-tight lg:text-hero-wide lg:font-normal"
              : "max-w-[13rem] text-[28px] font-medium leading-tight lg:max-w-[34rem] lg:text-hero-wide lg:font-normal"
            : eyebrow
              ? "mt-1 text-[30px] font-medium leading-tight lg:text-[46px] lg:font-normal"
              : "text-[30px] font-medium leading-tight lg:text-[46px] lg:font-normal"
        }
      >
        {title}
      </h1>
      {lead ? (
        <p
          className={
            compact
              ? "mt-2 max-w-[13rem] text-copy lg:mt-4 lg:max-w-none lg:text-lead"
              : "mt-1 text-copy font-medium lg:text-lead"
          }
        >
          {lead}
        </p>
      ) : null}
    </>
  );

  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      disabled={backDisabled}
      aria-label={copy.common.back}
      className={`${backClassName} disabled:opacity-60`}
    >
      <BackChevron />
    </button>
  ) : back ? (
    <Link href={back} aria-label={copy.common.back} className={backClassName}>
      <BackChevron />
    </Link>
  ) : null;

  return (
    <div className="min-h-dvh bg-page-sand font-rubik text-charcoal antialiased">
      <header className="sticky top-0 z-40 bg-paper shadow-lift-xs">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center px-3 lg:h-16 lg:px-8">
          <span aria-hidden="true" className="flex items-center gap-2 ps-1 text-brand-deep">
            <svg className="size-7" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="logo-h" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="var(--color-heart-a)" />
                  <stop offset="1" stopColor="var(--color-heart-b)" />
                </linearGradient>
              </defs>
              <path
                d="M12 20.6s-7.4-4.5-9.4-9C1.1 8.1 3.2 4.4 6.7 4.4c2.1 0 3.5 1.1 4.3 2.5h2c.8-1.4 2.2-2.5 4.3-2.5 3.5 0 5.6 3.7 4.1 7.2-2 4.5-9.4 9-9.4 9z"
                fill="url(#logo-h)"
              />
            </svg>
            <span className="text-[22px] font-medium">{copy.common.footer}</span>
          </span>
        </div>
      </header>

      <main className={nav ? undefined : wide ? "pb-16" : "relative overflow-hidden pb-24"}>
        <section className="band-field relative overflow-hidden text-paper">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
            <svg className="absolute -top-8 -end-8 w-36 opacity-20 lg:-top-14 lg:end-[30%] lg:w-72">
              <use href="#sh-arch" />
            </svg>
            <svg className="absolute bottom-6 end-[6%] w-9 opacity-30 lg:bottom-auto lg:end-auto lg:top-8 lg:start-[38%] lg:w-14">
              <use href="#sh-triangle" />
            </svg>
            <svg className="absolute -bottom-16 end-[2%] w-28 opacity-20 lg:end-auto lg:-bottom-14 lg:start-[50%] lg:w-44">
              <use href="#sh-flower" />
            </svg>
            <svg className="absolute top-10 -end-10 w-16 opacity-25 lg:top-12 lg:end-[6%] lg:w-28">
              <use href="#sh-circle" />
            </svg>
          </div>
          {openBanner ? (
            <div className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-5 lg:px-8 lg:pb-32 lg:pt-9">
              <div className="flex items-start gap-3 lg:gap-4">
                {backControl}
                <div className="min-w-0 max-w-[15rem] pt-0.5 lg:max-w-[40rem]">{titleBlock}</div>
              </div>
            </div>
          ) : (
            <div
              className={
                compact && eyebrow
                  ? "relative mx-auto flex max-w-[1240px] items-end gap-4 px-5 pb-24 pt-6 lg:gap-10 lg:px-8 lg:pb-32 lg:pt-12"
                  : "relative mx-auto flex max-w-[1240px] items-end gap-4 px-5 pb-24 pt-7 lg:gap-10 lg:px-8 lg:pb-32 lg:pt-12"
              }
            >
              <div className="min-w-0 flex-1 pb-2">
                {backControl ? (
                  <div className="flex items-start gap-3 lg:gap-4">
                    {backControl}
                    <div className="min-w-0 pt-0.5">{titleBlock}</div>
                  </div>
                ) : (
                  titleBlock
                )}
              </div>
              {illustration}
            </div>
          )}
          <svg
            aria-hidden="true"
            className="wave-flip absolute start-0 end-0 bottom-0 h-[30px] w-full fill-page-sand lg:h-[72px]"
          >
            <use href="#wave" />
          </svg>
        </section>

        {nav ? (
          <div className="relative mx-auto max-w-[1240px] px-4 pb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8 lg:px-8">
            <EditorSideNav current={nav} />
            <div className="arrive relative z-10 -mt-16 min-w-0 lg:order-1 lg:-mt-28">{children}</div>
          </div>
        ) : (
          <div className="relative z-10 mx-auto -mt-16 max-w-[1240px] px-4 lg:-mt-28 lg:px-8">
            <div className={wide ? "arrive w-full" : "arrive w-full lg:max-w-[560px]"}>{children}</div>
          </div>
        )}

        {nav || wide ? null : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute start-0 end-0 bottom-0 mx-auto h-40 max-w-[1240px] fill-paper opacity-70 lg:h-56"
          >
            <svg className="absolute -bottom-10 start-[4%] w-40 lg:w-64">
              <use href="#sh-door" />
            </svg>
            <svg className="absolute -bottom-6 end-[8%] w-48 lg:w-80">
              <use href="#sh-arch" />
            </svg>
            <svg className="absolute bottom-8 start-[46%] w-10 lg:w-16">
              <use href="#sh-triangle" />
            </svg>
          </div>
        )}
      </main>
    </div>
  );
}
