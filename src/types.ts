export type GeoPoint = { lat: number; lng: number };

export type UserRole = "master" | "client";

export type UserProfile = {
  uid: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar?: string;
  notifyEmail?: string; // notification destination
  notifyOnBooking?: boolean; // default true
  createdAt: any;
};

export type Master = {
  id: string;
  uid: string; // Legacy field for backward compatibility
  ownerId: string; // New field for consistency
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

// New Listing type for better organization
export type Listing = {
  id: string;
  ownerId: string; // User ID of the listing owner
  isPublished: boolean;
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
  createdAt?: any;
  updatedAt?: any;
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
  uid: string;
  displayName: string;
  city: string;
  services: string[];
  languages: string[];
  avatarUrl: string | null;
  about?: string | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  coords?: { lat: number; lng: number } | null;
  updatedAt?: unknown; // Firestore serverTimestamp
  createdAt?: unknown;
};

// бронирование услуги
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'canceled' | 'completed';

export type Booking = {
 id: string;
 profileId: string; // анкета мастера
 masterUid: string; // owner of listing
 masterEmail: string; // where to notify
 clientUid: string;
 clientEmail?: string; // fallback for notifications
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

// Master profile form data type
export type MasterProfileFormData = {
  name: string;
  city: {
    label: string;
    lat?: number;
    lng?: number;
  };
  services: string[];
  languages: string[];
  priceFrom?: number;
  priceTo?: number;
  about?: string;
  photos?: string[];
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