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
  updatedAt?: any;
};
