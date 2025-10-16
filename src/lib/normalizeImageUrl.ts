export function normalizeImageUrl(input: any): string | null {
  if (!input) return null;
  if (typeof input === 'string') {
    return input.startsWith('http') ? input : null;
  }
  if (typeof input === 'object') {
    const candidate = input.url || input.src || input.downloadURL || null;
    return typeof candidate === 'string' && candidate.startsWith('http') ? candidate : null;
  }
  return null;
}
