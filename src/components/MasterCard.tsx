'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Master } from '@/types';

type MasterWithExtras = Master & {
uid?: string;
profileId?: string;
mainServices?: string[];
priceRange?: { min?: number; max?: number };
priceMin?: number;
priceMax?: number;
photo?: string;
reviewsCount?: number;
};

export default function MasterCard({ master }: { master: MasterWithExtras }) {
// фото: поддерживаем и старые, и новые поля
const photo =
  (Array.isArray(master.photos) && master.photos[0]) ||
  (Array.isArray(master.photoUrls) && master.photoUrls[0]) ||
  master.photo || // если где-то остался одиночный photo
  "/placeholder.jpg";

// Город
const city = master.city || '';

// Услуга: mainServices[0] или services[0]
const service =
(master.mainServices && master.mainServices[0]) ||
(Array.isArray(master.services) && master.services[0]) ||
'';

// Рейтинг + кол-во отзывов
const rating =
typeof master.rating === 'number'
? master.rating
: typeof master.ratingAvg === 'number'
? master.ratingAvg
: undefined;
const reviews = typeof master.reviewsCount === 'number' ? master.reviewsCount : undefined;

// Правильный id профиля
const pid = master.id || master.profileId || master.uid;

return (
<div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
{/* Фото */}
<div className="mb-3 overflow-hidden rounded-lg border bg-gray-100">
<Image
src={photo}
alt={master.displayName || master.name || 'Master'}
width={800}
height={600}
className="h-48 w-full object-cover"
unoptimized
/>
</div>

{/* Имя + город */}
<div className="flex items-start justify-between gap-2">
<div>
<div className="text-lg font-semibold">
{master.displayName || master.name || 'Master'}
</div>
{city && <div className="text-sm text-gray-500">{city}</div>}
{service && <div className="mt-1 text-sm text-gray-700">{service}</div>}
</div>

{/* Звезды */}
{typeof rating === 'number' && (
<div className="text-right">
<div className="leading-none">
<span className="text-amber-500">{'★'.repeat(Math.round(rating))}</span>
<span className="text-gray-300">{'★'.repeat(5 - Math.round(rating))}</span>
</div>
<div className="text-xs text-gray-500 mt-0.5">
{rating.toFixed(1)}{typeof reviews === 'number' ? ` · ${reviews}` : '' }
</div>
</div>
)}
</div>

{/* Кнопка */}
<div className="mt-4">
{pid ? (
<Link
href={`/masters/${pid}`}
className="inline-flex items-center justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700"
>
View profile
</Link>
) : (
<button
disabled
className="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-500"
title="Profile id is missing"
>
View profile
</button>
)}
</div>
</div>
);
}
