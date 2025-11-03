"use client";

export default function Stars({ value = 0, count = 0 }: { value?: number | null; count?: number }) {
  if (typeof value !== "number") return null;
  
  function Star({ filled }: { filled: boolean }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill={filled ? "#FFD700" : "#E5E7EB"}
        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.462a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.462a1 1 0 00-1.176 0l-3.385 2.462c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.048 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.285-3.967z" />
      </svg>
    );
  }
  
  return (
    <div className="flex gap-[2px] items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(value)} />
      ))}
      <span className="ml-1 text-sm text-slate-800 font-medium">
        {value.toFixed(1)}
      </span>
      {count ? (
        <span className="text-xs text-slate-400 ml-0.5">({count})</span>
      ) : null}
    </div>
  );
}

