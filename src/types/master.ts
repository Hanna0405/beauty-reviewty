export type MasterRaw = {
  id?: string;
  name?: string;
  title?: string; // Legacy field
  about?: string;
  city?: string;
  services?: string[];
  languages?: string[];
  minPrice?: number;
  maxPrice?: number;
  priceFrom?: number; // Legacy field
  priceTo?: number; // Legacy field
  status?: 'active' | 'hidden';
  isPublished?: boolean;
  photos?: string[];
  lat?: number;
  lng?: number;
  location?: { lat: number; lng: number }; // Legacy field
  rating?: number;
  ratingAvg?: number; // Legacy field
  ratingCount?: number;
  ownerId?: string;
  uid?: string; // Legacy field
  createdAt?: any;
  updatedAt?: any;
};

export type Master = {
  id: string;
  name: string;
  about: string;
  city: string;
  services: string[];
  languages: string[];
  minPrice: number;
  maxPrice: number;
  status: 'active' | 'hidden';
  isPublished: boolean; // always defined
  photos: string[];
  lat?: number;
  lng?: number;
  rating: number;
};
