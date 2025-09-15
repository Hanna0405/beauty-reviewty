export type ReviewPhoto = { url: string; path: string; width?: number; height?: number };
export type Review = {
 id?: string;
 listingId: string;
 authorId: string;
 rating: 1|2|3|4|5;
 text: string;
 photos: ReviewPhoto[];
 isPublic: boolean;
 createdAt?: any;
 updatedAt?: any;
 // Denormalized fields for community reviews
 city?: string;
 services?: string[];
 masterRef?: { type: 'listing'|'community', id: string, slug?: string, listingId?: string };
};
