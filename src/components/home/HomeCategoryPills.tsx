import Link from "next/link";

const CATEGORIES = [
  { emoji: "💇", label: " Hair" },
  { emoji: "💅", label: " Nails" },
  { emoji: "👁", label: " Lashes" },
  { emoji: "💆", label: " Massage" },
  { emoji: "💉", label: " Filler" },
  { emoji: "💄", label: " Makeup" },
  { emoji: "🧖", label: " Facial" },
  { emoji: "✏️", label: " Eyebrows" },
  { emoji: "🖋", label: " Tattoo" },
  { emoji: "💋", label: " PMU" },
] as const;

export default function HomeCategoryPills() {
  return (
    <div className="relative -mx-0.5">
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto pb-0.5 pl-0.5 pr-8 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map(({ emoji, label }) => (
          <Link
            key={`${emoji}-${label.trim()}`}
            href="/masters"
            className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-rose-200/65 bg-gradient-to-b from-white to-rose-50/70 px-3 py-1.5 text-[13px] font-semibold text-rose-800 shadow-[0_1px_3px_rgba(219,39,119,0.1)] ring-1 ring-rose-100/40 transition hover:border-rose-300/90 hover:shadow-[0_2px_6px_rgba(219,39,119,0.12)]"
          >
            <span className="text-[13px] leading-none opacity-95" aria-hidden>
              {emoji}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 flex w-9 items-center justify-end bg-gradient-to-l from-[#fff1f6] via-[#fff1f6]/95 to-transparent pl-6"
        aria-hidden
      >
        <span className="pb-0.5 text-base font-semibold leading-none text-pink-400/85">
          ›
        </span>
      </div>
    </div>
  );
}
