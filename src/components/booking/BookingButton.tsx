'use client';
import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Listing } from '@/types/listing';

type Props = {
 listing: Listing; // must include id and ownerId (or profileId)
};

function pad2(n: number) { return String(n).padStart(2, '0'); }
function normalizeDate(s: string) {
 // Accept '30.09.2025' or '2025-09-30' -> '2025-09-30'
 if (!s) return '';
 const dot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
 if (dot) return `${dot[3]}-${dot[2]}-${dot[1]}`;
 const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if (iso) return s;
 try {
 const d = new Date(s);
 if (isNaN(d.getTime())) return '';
 return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
 } catch { return ''; }
}
function normalizeTime(s: string) {
 // Accept '18:23' or '6:23 PM' -> '18:23'
 if (!s) return '';
 const hhmm = s.match(/^(\d{1,2}):(\d{2})/);
 if (hhmm) {
 const hh = Number(hhmm[1]);
 const mm = Number(hhmm[2]);
 if (hh>=0 && hh<24 && mm>=0 && mm<60) return `${pad2(hh)}:${pad2(mm)}`;
 }
 try {
 const d = new Date(`1970-01-01T${s}`);
 if (isNaN(d.getTime())) return '';
 return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
 } catch { return ''; }
}

export default function BookingButton({ listing }: Props) {
 const params = useParams<{ id: string }>();
 const { user } = useAuth();

 const listingId = useMemo(
 () => listing?.id ?? params?.id ?? '',
 [listing?.id, params?.id]
 );

 const profileId = listing?.ownerId || (listing as any)?.profileId || '';
 const clientId = user?.uid || '';

 const [date, setDate] = useState('');
 const [time, setTime] = useState('');
 const [duration, setDuration] = useState('60');
 const [note, setNote] = useState('');
 const [sending, setSending] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const values = {
 dateISO: normalizeDate(date),
 timeISO: normalizeTime(time),
 durationMin: Number.isFinite(Number(duration)) ? Number(duration) : NaN,
 };

 const missing: string[] = [];
 if (!listingId) missing.push('listingId');
 if (!profileId) missing.push('profileId');
 if (!clientId) missing.push('clientId');
 if (!values.dateISO) missing.push('date');
 if (!values.timeISO) missing.push('time');
 if (!Number.isFinite(values.durationMin) || values.durationMin <= 0) missing.push('duration');

 const isValid = missing.length === 0;

 async function onSend() {
 setError(null);
 if (!isValid) {
 setError(`Missing fields: ${missing.join(', ')}`);
 return;
 }
 const payload = {
 listingId,
 profileId,
 clientId,
 date: values.dateISO, // YYYY-MM-DD
 time: values.timeISO, // HH:mm
 durationMin: values.durationMin,
 note: note?.trim() || '',
 };

 console.debug('[booking] payload →', payload);
 setSending(true);
 try {
 const res = await fetch('/api/booking/request', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });
 if (!res.ok) {
 const t = await res.text().catch(()=> '');
 throw new Error(`API ${res.status}: ${t || 'Unknown error'}`);
 }
 // success UI
 alert('Request sent!');
 setNote('');
 } catch (e:any) {
 console.error('Booking send failed', e);
 setError(e.message || 'Failed to send');
 } finally {
 setSending(false);
 }
 }

 return (
 <div className="space-y-3">
 {/* Inputs: replace with your existing UI controls */}
 <input value={date} onChange={e=>setDate(e.target.value)} placeholder="YYYY-MM-DD or DD.MM.YYYY" />
 <input value={time} onChange={e=>setTime(e.target.value)} placeholder="HH:mm" />
 <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (min)" />
 <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />

 {error && <div className="text-sm text-red-600">{error}</div>}
 {!error && !isValid && <div className="text-xs text-amber-600">Missing fields: {missing.join(', ')}</div>}

 <button
 className="btn btn-primary w-full"
 disabled={!isValid || sending}
 onClick={onSend}
 >
 {sending ? 'Sending…' : 'Send request'}
 </button>
 </div>
 );
}