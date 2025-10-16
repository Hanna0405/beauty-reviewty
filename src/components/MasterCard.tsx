import Image from 'next/image';
import Link from 'next/link';
import { SafeText } from '@/lib/safeText';

type Props = { master: any };

// Helper functions for safe rendering
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

export default function MasterCard({ master }: Props) {
  // Unified avatar fallback: photoURL → avatarUrl → avatar.url
  const avatarSrc = master?.photoURL || master?.avatarUrl || master?.avatar?.url || null;

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-pink-100">
        {avatarSrc ? (
          <Image src={avatarSrc} alt={master.displayName ?? 'Master'} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-pink-400">
            {(master?.displayName || 'M').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">{master.displayName ?? 'Master'}</h3>
          <Link href={`/master/${encodeURIComponent(master.uid ?? master.id)}`} className="text-sm underline">Open</Link>
        </div>
        <div className="text-sm text-gray-600">
          {formatCity(master?.city)}
        </div>
        <div className="mt-1 line-clamp-1 text-sm">
          {formatTagList(master?.services, master?.serviceNames)}
        </div>
        <div className="text-xs text-gray-500">
          {formatTagList(master?.languages, master?.languageNames)}
        </div>
      </div>
    </div>
  );
}