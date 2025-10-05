export function logMapsKey() {
  const key = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  const masked = key ? key.slice(0, 6) + '***' + key.slice(-4) : '(empty)';
  if (typeof window !== 'undefined') {
    console.info('[BR] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:', masked);
  }
  return key;
}
