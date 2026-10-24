import Link from "next/link";
import { copy } from "@/lib/copy";

const backClassName =
  "press -ms-1.5 grid size-11 shrink-0 place-items-center rounded-full bg-paper/15 text-paper outline-none hover:bg-paper/25 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-paper motion-safe:transition-colors lg:mt-1.5 lg:size-12";

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

export function EditorFrame({
  title,
  back,
  onBack,
  backDisabled = false,
  lead,
  illustration,
  eyebrow,
  wide = false,
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
      {/* Shape ids are referenced by the sent card. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <symbol id="sh-arch" viewBox="0 0 280 140">
            <path
              transform="translate(-178 -429)"
              d="M317.199 429C243.84 429 183.598 485.759 178.031 557.506C177.574 563.288 182.225 568.234 188.097 568.234H247.577C251.847 568.234 255.431 565.114 255.965 560.93C259.625 530.42 285.705 506.682 317.199 506.682C346.939 506.682 371.875 527.833 377.67 555.832C379.119 562.984 385.372 568.234 392.693 568.234H447.673C452.783 568.234 456.824 563.897 456.443 558.799C451.562 486.443 390.939 429 317.199 429Z"
            />
          </symbol>
          <symbol id="sh-flower" viewBox="0 0 205 205">
            <path
              transform="translate(-75.4 -1057.4)"
              d="M98.0664 1159.72C97.9545 1159.61 97.843 1159.5 97.7318 1159.38C75.553 1137.21 75.4044 1101.4 97.3998 1079.4C119.395 1057.4 155.206 1057.55 177.384 1079.73C177.495 1079.84 177.606 1079.95 177.716 1080.07C177.826 1079.95 177.937 1079.84 178.048 1079.73C200.227 1057.55 236.037 1057.4 258.032 1079.4C280.028 1101.4 279.879 1137.21 257.701 1159.38C257.623 1159.46 257.546 1159.54 257.468 1159.62C257.434 1159.65 257.4 1159.68 257.366 1159.72C257.478 1159.83 257.589 1159.94 257.701 1160.05C279.879 1182.23 280.028 1218.04 258.032 1240.03C236.037 1262.03 200.227 1261.88 178.048 1239.7C177.937 1239.59 177.826 1239.48 177.716 1239.37C177.606 1239.48 177.495 1239.59 177.384 1239.7C155.206 1261.88 119.395 1262.03 97.3999 1240.03C75.4045 1218.04 75.5531 1182.23 97.7318 1160.05C97.843 1159.94 97.9545 1159.83 98.0664 1159.72Z"
            />
          </symbol>
          <symbol id="sh-triangle" viewBox="0 0 210 176">
            <path
              transform="translate(-566 -532)"
              d="M654.569 542.825L572.196 683.117C566.016 693.666 573.609 706.851 585.881 706.851H755.129C767.577 706.851 775.17 693.314 768.637 682.766L681.673 542.473C675.405 532.364 660.572 532.54 654.569 542.825Z"
            />
          </symbol>
          <symbol id="sh-door" viewBox="0 0 160 193">
            <path
              transform="translate(-518 -951)"
              d="M597.429 951C553.582 951 518 988.915 518 1035.65L518 1126.72C518 1136.03 525.583 1143.5 534.819 1143.5H658.58C668.691 1143.5 676.857 1135.35 676.857 1125.27L676.857 1035.65C676.954 988.915 641.372 951 597.429 951Z"
            />
          </symbol>
          <symbol id="sh-circle" viewBox="0 0 178 178">
            <circle cx="89" cy="89" r="89" />
          </symbol>
          <symbol id="wave" viewBox="0 0 1632 160" preserveAspectRatio="none">
            <path
              transform="translate(0 -4423)"
              d="m0 4423.20703c226.015625 115.91406 542.398437 167.99479 949.148437 156.24219 315.351563-12.4349 542.968753-38.20478 682.851563-77.30966v80.86044h-1632z"
            />
          </symbol>
        </defs>
      </svg>

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

      <main className={wide ? "pb-16" : "relative overflow-hidden pb-24"}>
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

        <div className="relative z-10 mx-auto -mt-16 max-w-[1240px] px-4 lg:-mt-28 lg:px-8">
          <div className={wide ? "arrive w-full" : "arrive w-full lg:max-w-[560px]"}>{children}</div>
        </div>

        {wide ? null : (
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
