import type { NormalizedCity } from '@/types/city';
import { toSlug } from './slug';

export function ensureMirrors(c: NormalizedCity | null): NormalizedCity | null {
  if (!c) return null;
  const slug = toSlug(c.formatted || c.cityName || '');
  return { ...c, slug, cityKey: slug, cityName: c.formatted || c.cityName || '' };
}
