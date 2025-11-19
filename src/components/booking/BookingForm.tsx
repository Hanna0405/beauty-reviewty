'use client';
import React, { useState, useMemo } from 'react';
import { sendBooking } from '@/lib/bookingClient';
import toast from 'react-hot-toast';

type Props = {
  listingId: string;
  masterUid: string;
  onSuccess?: () => void;
};

export default function BookingForm({ listingId, masterUid, onSuccess }: Props) {
  const [date, setDate] = useState(''); // '2025-09-30'
  const [time, setTime] = useState(''); // '17:28'
  const [durationMin, setDurationMin] = useState<number | ''>(60);
  const [note, setNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const missing = useMemo(() => !date || !time || !masterUid || !durationMin, [date, time, masterUid, durationMin]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missing) { setErr('Missing fields'); return; }
    setErr(null);
    setLoading(true);
    try {
      const res = await sendBooking({
        listingId,
        masterId: masterUid,
        date, 
        time, 
        duration: Number(durationMin), 
        note, 
        contactName: clientName, 
        contactPhone: clientPhone,
      });
      setSent(true);
      toast.success("Booking request sent!");
      // Close shortly after success
      setTimeout(() => {
        setDate('');
        setTime('');
        setDurationMin(60);
        setNote('');
        setClientName('');
        setClientPhone('');
        setSent(false);
        onSuccess?.();
      }, 1200);
    } catch (e: any) {
      setErr(e.message ?? 'Failed to send');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md border border-pink-100">
      <form onSubmit={onSubmit} className="space-y-4">
      {/* DATE */}
      <input type="date" className="input w-full"
        value={date} onChange={e=>setDate(e.target.value)} required />
      {/* TIME */}
      <input type="time" className="input w-full"
        value={time} onChange={e=>setTime(e.target.value)} required />
      {/* DURATION */}
      <input type="number" min={10} step={5} className="input w-full"
        value={durationMin} onChange={e=>setDurationMin(Number(e.target.value)||'')} placeholder="Duration (min)" required />
      {/* NOTE */}
      <textarea className="textarea w-full" rows={3}
        value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
      {/* Optional contact */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="input w-full" placeholder="Your name (optional)"
          value={clientName} onChange={e=>setClientName(e.target.value)} />
        <input className="input w-full" placeholder="Phone (optional)"
          value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {sent && <p className="text-sm text-green-600">Request sent ✔️</p>}

      <button type="submit" disabled={loading || !!missing}
        className={`bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg w-full transition ${loading || missing ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {loading ? 'Sending…' : 'Send request'}
      </button>
      </form>
    </div>
  );
}
