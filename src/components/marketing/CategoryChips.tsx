'use client';
import Link from 'next/link';

const CATS = [
  { emoji: '💇‍♀️', label: 'Hair', slug: 'hair' },
  { emoji: '💅', label: 'Nails', slug: 'nails' },
  { emoji: '👁️', label: 'Lashes', slug: 'lashes' },
  { emoji: '💄', label: 'Makeup', slug: 'makeup' },
];

export default function CategoryChips() {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-wrap gap-2 md:gap-3 justify-center">
      {CATS.map((c)=>(
        <Link
          key={c.slug}
          href={`/masters?service=${encodeURIComponent(c.slug)}`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-rose-200/70 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300 shadow-sm transition text-sm"
          aria-label={`Filter by ${c.label}`}
        >
          <span aria-hidden>{c.emoji}</span>
          <span>{c.label}</span>
        </Link>
      ))}
    </div>
  );
}
