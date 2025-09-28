'use client';
import { useEffect, useState } from 'react';
import { fetchBookings, updateBooking } from '@/components/booking/api';
import { useAuth } from '@/contexts/AuthContext';

export default function MasterBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user?.uid]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await fetchBookings('master', user.uid);
      setBookings(list);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, action: 'confirm' | 'decline' | 'delete') => {
    if (!user) return;
    try {
      await updateBooking(id, action, user.uid);
      await loadBookings(); // Reload after update
    } catch (e: any) {
      setError(e?.message || 'Failed to update booking');
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please sign in.</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const startDate = b.startAt?.toDate ? b.startAt.toDate() : (b.startAt?._seconds ? new Date(b.startAt._seconds*1000) : null);
            const endDate = startDate ? new Date(startDate.getTime() + (b.durationMin * 60 * 1000)) : null;
            return (
              <div key={b.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Booking #{b.id.slice(-8)}</div>
                    <div className="text-sm text-gray-500">
                      {startDate ? startDate.toLocaleString() : '-'} — {endDate ? endDate.toLocaleTimeString() : '-'} • {b.durationMin} min
                    </div>
                    <div className="text-sm text-gray-600">Client: {b.contactName || b.clientId || 'Guest'}</div>
                    {b.contactPhone && <div className="text-sm text-gray-600">Phone: {b.contactPhone}</div>}
                    {b.note && <div className="text-sm mt-1">"{b.note}"</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {b.status}
                    </span>
                    {b.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateStatus(b.id, 'confirm')} 
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => updateStatus(b.id, 'decline')} 
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => updateStatus(b.id, 'delete')} 
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
