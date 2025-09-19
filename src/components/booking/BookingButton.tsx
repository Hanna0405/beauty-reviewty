'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BOOKING_API } from '@/lib/bookingPaths';
import { authedJson } from '@/lib/authedFetch';

type Props = {
  listingId: string;
  masterUid: string;
  serviceKey?: string;
  serviceName?: string;
  className?: string;
};

export default function BookingButton({ 
  listingId, 
  masterUid, 
  serviceKey = 'general', 
  serviceName = 'General Service',
  className = "inline-flex items-center justify-center w-full md:w-auto px-5 py-3 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition"
}: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBooking = async () => {
    if (!user) {
      setError('Please log in to book');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create booking request
      const startIso = new Date().toISOString();
      const endIso = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

      // Debug logging
      console.log('Booking payload', {
        listingId: String(listingId),
        masterUid: String(masterUid),
        serviceKey,
        serviceName,
        start: startIso,
        end: endIso,
      });

      const res = await authedJson(BOOKING_API.request, {
        json: {
          listingId: String(listingId), // ensure string
          masterUid: String(masterUid),
          serviceKey,
          serviceName,
          start: startIso,
          end: endIso,
          phone: '',
          notes: '',
        },
      });

      console.log('Booking request successful:', res);
      
      // Show success message or redirect
      alert('Booking request sent successfully!');
      
    } catch (e: any) {
      console.error('Booking request failed', e);
      setError(e.message || 'Booking request failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <a 
        href="/auth/login" 
        className={className}
      >
        Log in to Book
      </a>
    );
  }

  return (
    <div>
      <button
        onClick={handleBooking}
        disabled={loading}
        className={className}
      >
        {loading ? 'Sending...' : 'Book now'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
