export type CommunityMaster = {
 id?: string;
 slug: string; // for /reviewty/m/[slug]
 displayName: string; // name/nickname/salon
 city: string;
 services: string[];
 contact?: { phone?: string; instagram?: string; tiktok?: string; salonName?: string };
 createdByUid: string;
 createdAt?: any;
 claimedListingId?: string | null;
};
