export type BookingStatus = 'pending' | 'approved' | 'declined';

export interface Booking {
  id: string;
  clientId?: string | null;
  contactName?: string;
  contactPhone?: string;

  masterId: string;

  listingId: string;

  note?: string;

  // new: explicit time window using Firestore Timestamp
  startAt: any; // Firestore Timestamp
  durationMin: number;

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  status: BookingStatus;
}
