import { MasterRaw, Master } from '@/types/master';

export function normalizeMaster(input: MasterRaw, fallbackId?: string): Master {
  const id = (input?.id ?? fallbackId ?? '').toString();
  return {
    id,
    name: input?.name ?? input?.title ?? 'Unnamed',
    about: input?.about ?? '',
    city: input?.city ?? '',
    services: Array.isArray(input?.services) ? input.services.map(String) : [],
    languages: Array.isArray(input?.languages) ? input.languages.map(String) : [],
    minPrice: typeof input?.minPrice === 'number' ? input.minPrice : 
              typeof input?.priceFrom === 'number' ? input.priceFrom : 0,
    maxPrice: typeof input?.maxPrice === 'number' ? input.maxPrice : 
              typeof input?.priceTo === 'number' ? input.priceTo : 0,
    status: input?.status === 'hidden' ? 'hidden' : 'active',
    isPublished: input?.isPublished !== false, // default TRUE
    photos: Array.isArray(input?.photos) ? input.photos.map(String) : [],
    lat: typeof input?.lat === 'number' ? input.lat : 
         (input?.location && typeof input.location.lat === 'number') ? input.location.lat : undefined,
    lng: typeof input?.lng === 'number' ? input.lng : 
         (input?.location && typeof input.location.lng === 'number') ? input.location.lng : undefined,
    rating: typeof input?.rating === 'number' ? input.rating : 
            typeof input?.ratingAvg === 'number' ? input.ratingAvg : 0,
  };
}

export function normalizeMasters(arr: MasterRaw[] | undefined | null): Master[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((m, i) => normalizeMaster(m ?? {}, (m as any)?.id ?? String(i)));
}
