export function getPublicEnv() {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  // Trim to avoid accidental spaces/newlines
  const key = (raw || '').trim();

  if (typeof window !== 'undefined') {
    // Masked log to verify key presence in prod without exposing it
    const masked = key ? key.slice(0, 6) + '***' + key.slice(-4) : '(empty)';
    // Only log once
    if (!(window as any).__BR_MAPS_ENV_LOGGED__) {
      console.info('[BR] Maps key present:', key ? 'YES' : 'NO', 'value:', masked);
      (window as any).__BR_MAPS_ENV_LOGGED__ = true;
    }
  }
  return { GOOGLE_MAPS_KEY: key };
}