"use client";

import Link from "next/link";
import NextImage from "next/image";

type Props = {
  coverUrl: string | null;
  reviewCount: number;
  ratingAvg: number | null;
};

function IconPinOutline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={10} r={2.25} stroke="currentColor" strokeWidth={1.75} />
    </svg>
  );
}

function IconStarOutline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3L14.09 8.26L20 9.27L15.5 13.14L16.58 19.02L12 16.18L7.42 19.02L8.5 13.14L4 9.27L9.91 8.26L12 3Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function badgeText(reviewCount: number, ratingAvg: number | null): string {
  if (reviewCount > 0) {
    if (ratingAvg != null && Number.isFinite(ratingAvg)) {
      const r = Math.round(ratingAvg * 10) / 10;
      return `${r.toFixed(1)} (${reviewCount} reviews)`;
    }
    return `(${reviewCount} reviews)`;
  }
  return "New";
}

export default function HomeHero({ coverUrl, reviewCount, ratingAvg }: Props) {
  const badge = badgeText(reviewCount, ratingAvg);

  return (
    <section className="-mx-px">
      <div className="rounded-3xl border border-rose-100/90 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/70 shadow-sm overflow-hidden">
        <div className="flex flex-row items-center gap-2.5 sm:gap-3 p-3.5 sm:p-4 lg:gap-8 lg:p-8 lg:items-center">
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-2 lg:gap-3 lg:pr-4">
            <h1 className="text-xl sm:text-2xl font-bold text-rose-900 leading-snug tracking-tight lg:text-3xl xl:text-[2rem]">
              Find beauty masters near you
            </h1>
            <div className="space-y-0.5 text-[13px] sm:text-sm leading-snug">
              <p className="flex items-start gap-2">
                <span className="mt-[2px] shrink-0 text-pink-500">
                  <IconPinOutline />
                </span>
                <span className="text-neutral-700">
                  Search by city, service, and language
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="mt-[2px] shrink-0 text-pink-500">
                  <IconStarOutline />
                </span>
                <span className="text-neutral-700">
                  Real reviews with photos
                </span>
              </p>
            </div>
            <div className="flex flex-nowrap gap-1.5 sm:gap-2 pt-0.5 min-w-0">
              <Link
                href="/masters"
                className="inline-flex min-h-[36px] max-w-[50%] flex-1 shrink items-center justify-center rounded-xl bg-pink-500 px-2 py-1.5 text-[11px] font-semibold leading-tight text-white shadow-sm transition hover:bg-pink-600 sm:max-w-none sm:flex-none sm:px-3.5 sm:py-2 sm:text-[13px]"
              >
                {" Find Masters "}
              </Link>
              <Link
                href="/skincare-checker"
                className="inline-flex min-h-[36px] max-w-[50%] flex-1 shrink items-center justify-center rounded-xl border border-pink-400/80 bg-white px-2 py-1.5 text-[11px] font-semibold leading-tight text-pink-600 shadow-sm transition hover:bg-pink-50 sm:max-w-none sm:flex-none sm:px-3.5 sm:py-2 sm:text-[13px]"
              >
                {"Check skincare AI "}
              </Link>
            </div>
          </div>

          <div className="relative shrink-0 w-[41%] max-w-[150px] sm:max-w-[168px] lg:w-auto lg:min-w-[200px] lg:max-w-[240px] xl:max-w-[280px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-rose-50 shadow-md ring-1 ring-rose-100/70">
              {coverUrl ? (
                <NextImage
                  src={coverUrl}
                  alt="Featured listing photo"
                  fill
                  sizes="(max-width: 1024px) 168px, 280px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4">
                  <NextImage
                    src="/icons/br-icon-512.svg"
                    alt=""
                    width={96}
                    height={96}
                    className="object-contain opacity-90"
                  />
                </div>
              )}
            </div>
            <div
              className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-xl border border-white/70 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-neutral-800 shadow-lg backdrop-blur-sm sm:text-[11px] max-w-[calc(100%-0.5rem)]"
              role="img"
              aria-label={
                reviewCount > 0
                  ? `Rating ${badge}`
                  : "New listing"
              }
            >
              <span className="text-pink-500">★</span>
              <span className="truncate">{badge}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
