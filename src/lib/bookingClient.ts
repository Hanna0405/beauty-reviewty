import { getAuth } from 'firebase/auth';

export type BookingRequestPayload = {
 listingId: string;
 masterId: string;
 clientId?: string | null;
 date: string; // 'YYYY-MM-DD' или 'DD.MM.YYYY'
 time: string; // 'HH:mm'
 duration: number;
 note?: string;
 contactName?: string;
 contactPhone?: string;
};

export async function sendBooking(input: BookingRequestPayload) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Add clientId if user is authenticated
  const payload = user ? { ...input, clientId: user.uid } : input;

  const res = await fetch('/api/booking/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  // Пинганём глобальный слушатель, чтобы бейдж обновился моментально
  try { window.dispatchEvent(new CustomEvent("notify:refresh")); } catch {}
  return data; // { ok: true, id: "..." }
}
