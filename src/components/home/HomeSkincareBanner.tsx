import Link from "next/link";

export default function HomeSkincareBanner() {
  return (
    <div className="rounded-2xl border border-pink-100/70 bg-gradient-to-r from-pink-50 via-rose-50/90 to-pink-50 shadow-sm px-3 py-2.5 sm:px-3.5 sm:py-3 lg:px-6 lg:py-4 flex flex-row items-center justify-between gap-3">
      <div className="min-w-0 flex-1 pr-1">
        <p className="text-left font-semibold text-[14px] sm:text-[15px] text-rose-900 leading-snug">
          <span className="mr-1" aria-hidden>
            🧴
          </span>
          {"Check your skincare ingredients "}
        </p>
        <p className="mt-0.5 text-left text-[11px] sm:text-[12px] text-rose-700/92 leading-snug">
          Scan your products and get AI analysis in seconds
        </p>
      </div>
      <Link
        href="/skincare-checker"
        className="inline-flex shrink-0 items-center justify-center self-center rounded-xl bg-pink-500 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-pink-600 sm:px-3 sm:py-2 sm:text-[13px]"
      >
        Check skincare
      </Link>
    </div>
  );
}
