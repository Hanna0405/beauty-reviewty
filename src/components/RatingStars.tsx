'use client';

type Props = {
value?: number; // 0..5 или undefined
count?: number; // кол-во отзывов (для подписи)
readOnly?: boolean; // по умолчанию true
onChange?: (v: number) => void;
className?: string;
};

export default function RatingStars({ value, count, readOnly = true, onChange, className = '' }: Props) {
const v = typeof value === 'number' ? Math.max(0, Math.min(5, value)) : undefined;
const stars = [1, 2, 3, 4, 5];

const click = (n: number) => {
if (readOnly) return;
onChange?.(n);
};

return (
<div className={`inline-flex items-center ${className}`} aria-label="rating">
{stars.map((n) => {
const filled = v ? n <= Math.floor(v) : false;
const half = v ? n === Math.ceil(v) && v % 1 >= 0.5 && n > Math.floor(v) : false;
return (
<button
key={n}
type="button"
onClick={() => click(n)}
disabled={readOnly}
aria-checked={n === v}
role="radio"
className={`text-xl leading-none ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${v == null ? 'opacity-40' : ''}`}
title={v != null ? `${v.toFixed(1)} / 5` : 'No reviews yet'}
>
{filled ? '★' : half ? '☆' : '☆'}
</button>
);
})}
<span className="ml-2 text-xs text-gray-600">
{v != null ? v.toFixed(1) : '—'}{typeof count === 'number' ? ` (${count})` : ''}
</span>
</div>
);
}