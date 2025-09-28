import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase.client";

export type Profile = {
  uid: string;
  slug?: string;
  displayName: string;
  avatarUrl?: string;
  citySlug?: string;
  city?: string;
  services: string[];
  languages: string[];
  ratingAvg?: number;
  reviewsCount?: number;
  minPrice?: number;
};

export type ListingItem = {
  id: string;
  title: string;
  masterUid: string;
  masterSlug?: string;
  masterDisplayName?: string;
  masterAvatarUrl?: string;
  isActive: boolean;
  serviceKey?: string;
  citySlug?: string;
  city?: string;
  priceFrom?: number;
  priceTo?: number;
  services: string[];
  languages: string[];
  photos?: string[];
  ratingAvg?: number;
  reviewsCount?: number;
};

export async function fetchProfilesByFilters(f: {
  city?: string;
  services?: string[];
  languages?: string[];
  ratingGte?: number;
}): Promise<Profile[]> {
  try {
    let q = query(collection(db, 'profiles'));
    
    // Apply filters
    if (f.city) {
      q = query(q, where('citySlug', '==', f.city));
    }
    if (f.services?.length) {
      q = query(q, where('services', 'array-contains-any', f.services));
    }
    if (f.languages?.length) {
      q = query(q, where('languages', 'array-contains-any', f.languages));
    }
    if (f.ratingGte) {
      q = query(q, where('ratingAvg', '>=', f.ratingGte));
    }
    
    // Order by rating and limit
    q = query(q, orderBy('ratingAvg', 'desc'), limit(50));
    
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        services: data.services || [],
        languages: data.languages || [],
      } as Profile;
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

export async function fetchListingsByFilters(f: {
  city?: string;
  services?: string[];
  languages?: string[];
  priceMax?: number;
  ratingGte?: number;
  masterUid?: string;
}): Promise<ListingItem[]> {
  try {
    let q = query(collection(db, 'listings'), where('status', '==', 'active'));
    
    // Apply filters
    if (f.city) {
      q = query(q, where('citySlug', '==', f.city));
    }
    if (f.services?.length) {
      q = query(q, where('services', 'array-contains-any', f.services));
    }
    if (f.languages?.length) {
      q = query(q, where('languages', 'array-contains-any', f.languages));
    }
    if (f.priceMax) {
      q = query(q, where('minPrice', '<=', f.priceMax));
    }
    if (f.masterUid) {
      q = query(q, where('masterUid', '==', f.masterUid));
    }
    
    // Order by creation date and limit
    q = query(q, orderBy('createdAt', 'desc'), limit(50));
    
    const snap = await getDocs(q);
    const listings: ListingItem[] = [];
    
    // Fetch master data for each listing
    for (const doc of snap.docs) {
      const data = doc.data();
      const listing: ListingItem = {
        id: doc.id,
        title: data.title,
        masterUid: data.masterUid || data.uid,
        isActive: data.status === 'active',
        citySlug: data.citySlug,
        city: data.city,
        priceFrom: data.minPrice,
        priceTo: data.maxPrice,
        services: data.services || [],
        languages: data.languages || [],
        photos: data.photos || [],
        ratingAvg: data.ratingAvg,
        reviewsCount: data.reviewsCount,
      };
      
      // Try to get master profile data
      try {
        const masterDoc = await getDocs(query(collection(db, 'profiles'), where('uid', '==', listing.masterUid), limit(1)));
        if (!masterDoc.empty) {
          const masterData = masterDoc.docs[0].data();
          listing.masterSlug = masterData.slug;
          listing.masterDisplayName = masterData.displayName;
          listing.masterAvatarUrl = masterData.avatarUrl;
        }
      } catch (error) {
        console.warn('Could not fetch master data for listing:', listing.id);
      }
      
      listings.push(listing);
    }
    
    return listings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

export async function fetchMasterListings(masterUid: string): Promise<ListingItem[]> {
  return fetchListingsByFilters({ masterUid });
}

export async function fetchProfileBySlug(slug: string): Promise<Profile | null> {
  try {
    const q = query(collection(db, 'profiles'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      services: data.services || [],
      languages: data.languages || [],
    } as Profile;
  } catch (error) {
    console.error('Error fetching profile by slug:', error);
    return null;
  }
}
