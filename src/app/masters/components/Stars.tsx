"use client";

export default function Stars({ value = 0, count = 0 }: { value?: number | null; count?: number }) {
  if (typeof value !== "number") return null;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  
  const fullStar = (idx: number) => (
    <svg key={`f${idx}`} width="16" height="16" viewBox="0 0 24 24" className="inline-block fill-amber-400">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.169L12 18.896l-7.335 3.871 1.401-8.169L.132 9.21l8.2-1.192z" />
    </svg>
  );
  
  const halfStar = () => (
    <svg key="half" width="16" height="16" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.169L12 18.896l-7.335 3.871 1.401-8.169L.132 9.21l8.2-1.192z" fill="url(#half)"/>
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.169L12 18.896l-7.335 3.871 1.401-8.169L.132 9.21l8.2-1.192z" fill="none" stroke="#fbbf24"/>
    </svg>
  );
  
  const emptyStar = (idx: number) => (
    <svg key={`e${idx}`} width="16" height="16" viewBox="0 0 24 24" className="inline-block">
      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.788 1.401 8.169L12 18.896l-7.335 3.871 1.401-8.169L.132 9.21l8.2-1.192z" fill="none" stroke="#fbbf24"/>
    </svg>
  );
  
  return (
    <div className="flex items-center gap-1 text-amber-500">
      <span className="flex items-center">
        {Array.from({length: full}).map((_, idx) => fullStar(idx))}
        {half && halfStar()}
        {Array.from({length: empty}).map((_, idx) => emptyStar(idx))}
      </span>
      <span className="text-xs text-zinc-600">({count})</span>
    </div>
  );
}

