export type BookingStatus = 'pending'|'confirmed'|'declined'|'canceled'|'completed';
export type Booking = {
 id?: string;
 listingId: string;
 clientId: string; // uid клиента
 profileId: string; // uid мастера (owner listing'а)
 date: string; // ISO (yyyy-mm-dd)
 time: string; // HH:mm
 durationMin: number;
 note?: string;
 status: BookingStatus;
 createdAt: any;
 updatedAt: any;
};