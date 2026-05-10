import React from 'react';

type ChipProps = { label: string };
export function Chip({ label }: ChipProps) {
  return (
    <span className="inline-flex w-auto max-w-full shrink-0 items-center rounded-full border px-2 py-0.5 text-xs">
      {label}
    </span>
  );
}

type Item = { name?: string; emoji?: string } | null | undefined;

type ChipsProps = { items?: Item[]; fallback?: string[]; className?: string };
export function Chips({ items, fallback, className }: ChipsProps) {
  const labels =
    (items?.map(i => (i?.emoji ? `${i.emoji} ${i?.name ?? ''}` : (i?.name ?? ''))) ?? fallback ?? [])
    .filter(Boolean);
  if (!labels.length) return null;
  return (
    <div
      className={[
        "mt-2 flex w-full min-w-0 flex-row flex-wrap items-center gap-2 [&>*]:max-w-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {labels.map((l, idx) => (
        <Chip key={idx} label={l!} />
      ))}
    </div>
  );
}
