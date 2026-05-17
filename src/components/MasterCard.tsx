import Image from 'next/image';
import Link from 'next/link';
import Stars from '@/app/masters/components/Stars';

type Props = { master: any; rating?: number | null; reviewCount?: number | null };

function formatCity(city?: any): string {
  if (!city) return '';
  if (typeof city === 'string') return city;
  return (city.cityName || city.formatted || '').trim();
}

function formatTag(t: any): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return [t.emoji ?? '', t.name ?? ''].filter(Boolean).join(' ').trim();
}

function formatTagList(items?: any[], fallback?: any[]): string {
  const arr = Array.isArray(items) && items.length ? items : (Array.isArray(fallback) ? fallback : []);
  return arr.map(formatTag).filter(Boolean).join(', ');
}

export default function MasterCard({ master, rating, reviewCount }: Props) {
  const avatarSrc =
    typeof master?.avatarUrl === 'string' && master.avatarUrl.trim()
      ? master.avatarUrl.trim()
      : null;

  return (
    <div className="flex w-full max-w-full min-w-0 gap-3 overflow-hidden rounded-lg border p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-pink-100">
        {avatarSrc ? (
          <Image src={avatarSrc} alt={master.displayName ?? 'Master'} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-pink-400">
            {(master?.displayName || 'M').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-medium">
            {master.displayName ?? 'Master'}
          </h3>
          <Link
            href={`/master/${encodeURIComponent(master.uid ?? master.id)}`}
            className="shrink-0 text-sm underline whitespace-nowrap"
          >
            Open
          </Link>
        </div>
        <div className="truncate text-sm text-gray-600">
          {formatCity(master?.city)}
        </div>
        {typeof rating === 'number' && (
          <div className="mt-2 min-w-0 max-w-full overflow-hidden">
            <Stars value={rating} count={reviewCount ?? 0} />
          </div>
        )}
        <div className="mt-1 line-clamp-2 break-words text-sm">
          {formatTagList(master?.services, master?.serviceNames)}
        </div>
        <div className="line-clamp-2 break-words text-xs text-gray-500">
          {formatTagList(master?.languages, master?.languageNames)}
        </div>
      </div>
    </div>
  );
}

