export type BookingStatus = "pending" | "confirmed" | "declined" | "canceled" | "completed";

export type Booking = {
  id?: string;
  listingId: string;
  masterUid: string; // owner of listing
  clientId: string; // current user uid
  startsAt: string; // ISO string in UTC
  durationMin: number; // 15..600
  note?: string;
  status: BookingStatus;
  createdAt?: any;
  updatedAt?: any;
};