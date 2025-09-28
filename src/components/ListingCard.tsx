import Image from 'next/image';
import Link from 'next/link';
import { SafeText } from '@/lib/safeText';

type Props = {
  listing: any; // expects { id, title, city, services, languages, photos?, rating? }
};

export default function ListingCard({ listing }: Props) {
  const cover = listing?.photos?.[0]?.url ?? null;
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100">
        {cover ? (
          <Image src={cover} alt={listing.title ?? 'Listing'} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">{listing.title ?? 'Listing'}</h3>
          <Link href={`/listing/${String(listing.id)}`} className="text-sm underline">Open</Link>
        </div>
        <div className="text-sm text-gray-600"><SafeText value={listing.cityName ?? listing?.city?.name ?? listing?.city} /></div>
        <div className="mt-1 line-clamp-1 text-sm"><SafeText value={listing.serviceNames ?? listing?.services} /></div>
        <div className="text-xs text-gray-500"><SafeText value={listing.languageNames ?? listing?.languages} /></div>
        {typeof listing.rating === 'number' && <div className="text-xs">Rating: {listing.rating}★</div>}
      </div>
    </div>
  );
}
