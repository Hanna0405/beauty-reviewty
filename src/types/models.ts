export type CityNormalized = {
  city?: string; // optional legacy
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  formatted?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  slug?: string;
};

export type SocialLinks = {
  website?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  telegram?: string;
  phone?: string;
  email?: string;
  other?: string;
};

export type MasterProfile = {
  id: string; // doc id
  uid?: string; // auth uid / profile uid
  role?: string; // 'master' etc.
  displayName?: string;
  nickname?: string;
  photoURL?: string;
  avatarUrl?: string; // legacy field
  services?: {key:string; name:string; emoji?:string}[];
  serviceKeys?: string[];
  serviceNames?: string[];
  languages?: {key:string; name:string; emoji?:string}[];
  languageKeys?: string[];
  languageNames?: string[];
  city?: CityNormalized;
  cityName?: string; // mirror for UI
  cityKey?: string; // mirror for filters
  ratingAvg?: number;
  rating?: number; // legacy field
  links?: SocialLinks; // prefer this if exists
  socials?: SocialLinks; // fallback legacy field
  createdAt?: any;
  updatedAt?: any;
};

export type Listing = {
  id: string;
  title?: string;
  city?: CityNormalized;
  cityName?: string;
  cityKey?: string;
  price?: number;
  photos?: string[];
  ownerUid?: string; // common
  profileUid?: string; // legacy/fallback
  masterUid?: string; // alternative
  userUid?: string; // alternative
  authorUid?: string; // alternative
  status?: 'active'|'inactive'|'draft';
  createdAt?: any;
};
