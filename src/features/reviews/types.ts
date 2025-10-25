export type ReviewTarget = 'listing' | 'master' | 'public';

export type BaseReviewPayload = {
  rating: number;
  text: string;
  photos?: string[];
  cityKey?: string | null;
  createdAt?: any;
};

export type ListingReviewPayload = BaseReviewPayload & {
  target: 'listing';
  listingId: string;
  masterId: string;
};

export type MasterReviewPayload = BaseReviewPayload & {
  target: 'master';
  masterId: string;
};

export type PublicReviewPayload = BaseReviewPayload & {
  target: 'public';
  isPublic: true;
  masterName: string;
  publicCardId?: string | null;
  threadKey?: string;
};
