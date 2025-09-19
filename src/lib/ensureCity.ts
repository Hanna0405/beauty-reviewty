import { NormalizedCity } from './cityNormalize';

export function ensureSelectedCity(c: NormalizedCity | null | undefined) {
  if (!c?.placeId) {
    throw new Error('City must be selected from autocomplete (no free text).');
  }
  return c;
}
