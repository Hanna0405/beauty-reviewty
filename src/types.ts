// роли пользователей
export type UserRole = 'client' | 'master' | 'admin';

// базовый документ пользователя
export type UserDoc = {
 uid: string;
 role: UserRole;
 displayName?: string;
 photoURL?: string;
 email?: string;
 phone?: string;
 city?: string;
 createdAt: any;
 updatedAt: any;
};

// анкета мастера (мастер может иметь несколько)
export type MasterProfile = {
 id: string;
 ownerUid: string; // id пользователя-мастера
 title: string; // заголовок профиля, напр. "Ногтевой мастер · Toronto"
 bio?: string;
 city: string;
 services: {
 id: string;
 name: string; // название услуги
 durationMin: number;
 price: number;
 currency: 'CAD';
 }[];
 photos: string[];
 rating?: { avg: number; count: number; sum: number };
 lat?: number;
 lng?: number;
 isActive: boolean;
 createdAt: any;
 updatedAt: any;
};

// бронирование услуги
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'canceled' | 'completed';

export type Booking = {
 id: string;
 profileId: string; // анкета мастера
 masterUid: string;
 clientUid: string;
 serviceId: string;
 serviceName: string;
 price: number;
 durationMin: number;
 date: string; // YYYY-MM-DD
 start: string; // HH:mm
 end: string; // HH:mm
 status: BookingStatus;
 note?: string;
 createdAt: any;
 updatedAt: any;
};

// отзыв
export type Review = {
 id: string;
 profileId: string;
 authorUid: string;
 rating?: number;
 text: string;
 photos?: string[];
 createdAt: any;
 visible: boolean;
};