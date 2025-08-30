export type GeoPoint = { lat: number; lng: number };

export type UserProfile = {
  uid: string;
  role: "master" | "client";
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: any;
};

export type Master = {
  id: string;
  uid: string;
  title: string;
  about?: string;
  city?: string;
  location?: GeoPoint | null;
  services: string[];
  languages: string[];
  priceFrom?: number;
  priceTo?: number;
  photos: string[];
  status: "active" | "hidden";
  ratingAvg?: number;
  ratingCount?: number;
  createdAt: any;
  updatedAt: any;
};

export type MasterWithExtras = Master & {
  distanceKm?: number;
  reviewsCount?: number;
  // Legacy properties for backward compatibility
  uid?: string;
  profileId?: string;
  mainServices?: string[];
  priceRange?: { min?: number; max?: number };
  priceMin?: number;
  priceMax?: number;
  photo?: string;
  photoUrls?: string[];
  rating?: number;
  displayName?: string;
  name?: string;
  bio?: string;
  lat?: number;
  lng?: number;
};

export type SearchFiltersValue = {
  q: string;
  city: string;
  service: string;
  price: "all" | "low" | "mid" | "high";
  languages: string[];
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