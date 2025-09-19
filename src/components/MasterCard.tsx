import Image from 'next/image';
import Link from 'next/link';
import { SafeText } from '@/lib/safeText';

type Props = { master: any };

export default function MasterCard({ master }: Props) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="relative h-16 w-16 overflow-hidden rounded-full border">
        {master?.avatarUrl ? (
          <Image src={master.avatarUrl} alt={master.displayName ?? 'Master'} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">{master.displayName ?? 'Master'}</h3>
          <Link href={`/master/${master.id}`} className="text-sm underline">Open</Link>
        </div>
        <div className="text-sm text-gray-600">
          <SafeText value={master?.cityName ?? master?.city} />
        </div>
        <div className="mt-1 line-clamp-1 text-sm">
          <SafeText value={master?.serviceNames ?? master?.services?.map((s: any) => s.name || s) ?? []} />
        </div>
        <div className="text-xs text-gray-500">
          <SafeText value={master?.languageNames ?? master?.languages?.map((l: any) => l.name || l) ?? []} />
        </div>
      </div>
    </div>
  );
}