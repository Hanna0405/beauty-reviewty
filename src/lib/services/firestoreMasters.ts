"use client";

import { requireDb } from "@/lib/firebase/client";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type {
  Master,
  Listing,
  SearchFiltersValue,
  MasterProfileFormData,
} from "@/types";

// Helper function to strip undefined values
function stripUndefined(obj: any): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Get a single master listing by ID
export async function getById(id: string): Promise<Master | null> {
  const db = requireDb();

  try {
    const docRef = doc(db, "masters", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Master;
    }
    return null;
  } catch (error) {
    console.error("Error getting master by ID:", error);
    throw error;
  }
}

// Get a single listing by ID
export async function getListingById(id: string): Promise<Listing | null> {
  const db = requireDb();

  try {
    const docRef = doc(db, "listings", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Listing;
    }
    return null;
  } catch (error) {
    console.error("Error getting listing by ID:", error);
    throw error;
  }
}

// Get all masters for a specific user
export async function getByUid(uid: string): Promise<Master[]> {
  const db = requireDb();

  try {
    const col = collection(db, "masters");
    const q = query(col, where("uid", "==", uid), orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Master[];
  } catch (error) {
    console.error("Error getting masters by UID:", error);
    throw error;
  }
}

// Get all listings for a specific owner
export async function getListingsByOwner(
  ownerId: string,
  limitCount: number = 50
): Promise<Listing[]> {
  const db = requireDb();

  try {
    const col = collection(db, "listings");
    const q = query(
      col,
      where("ownerUid", "==", ownerId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Listing[];
  } catch (error) {
    console.error("Error getting listings by owner:", error);
    throw error;
  }
}

// Search masters with filters
export async function searchMasters(
  filters: Partial<SearchFiltersValue>,
  limitCount: number = 50
): Promise<Master[]> {
  const db = requireDb();

  try {
    let q = query(collection(db, "masters"), where("status", "==", "active"));

    // Apply filters
    if (filters.city) {
      q = query(q, where("city", "==", filters.city));
    }

    if (filters.service) {
      q = query(q, where("services", "array-contains", filters.service));
    }

    if (filters.languages && filters.languages.length > 0) {
      q = query(q, where("languages", "array-contains-any", filters.languages));
    }

    q = query(q, orderBy("createdAt", "desc"), limit(limitCount));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Master[];
  } catch (error) {
    console.error("Error searching masters:", error);
    throw error;
  }
}

// Search listings with filters
export async function searchListings(
  filters: Partial<SearchFiltersValue>,
  limitCount: number = 50
): Promise<Listing[]> {
  const db = requireDb();

  try {
    const filterArray: any[] = [];

    if (filters.city) {
      filterArray.push(where("city", "==", filters.city));
    }

    if (filters.service) {
      filterArray.push(where("services", "array-contains", filters.service));
    }

    if (filters.languages && filters.languages.length > 0) {
      filterArray.push(
        where("languages", "array-contains-any", filters.languages)
      );
    }

    const col = collection(db, "listings");
    const q = query(
      col,
      ...filterArray,
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Listing[];
  } catch (error) {
    console.error("Error searching listings:", error);
    throw error;
  }
}

// Fetch public masters with filters
export async function fetchPublicMasters(
  filters: Partial<SearchFiltersValue>,
  limitCount: number = 50
): Promise<Master[]> {
  const db = requireDb();

  try {
    const filterArray: any[] = [];

    if (filters.city) {
      filterArray.push(where("city", "==", filters.city));
    }

    if (filters.service) {
      filterArray.push(where("services", "array-contains", filters.service));
    }

    if (filters.languages && filters.languages.length > 0) {
      filterArray.push(
        where("languages", "array-contains-any", filters.languages)
      );
    }

    const col = collection(db, "masters");
    const q = query(
      col,
      ...filterArray,
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    let masters = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Filter out deleted masters
      .filter((master: any) => !master.deleted) as Master[];

    // Filter by master visibility: exclude masters with isPublicProfile === false
    const visibilityFiltered: Master[] = [];
    for (const master of masters) {
      const masterUid =
        (master as any).uid ||
        (master as any).userId ||
        (master as any).ownerId ||
        (master as any).userUID ||
        master.id;
      if (masterUid) {
        const { shouldMasterBeVisibleInPublicSearch } = await import(
          "@/lib/settings/masterVisibility"
        );
        const isVisible = await shouldMasterBeVisibleInPublicSearch(masterUid);
        if (isVisible) {
          visibilityFiltered.push(master);
        }
      } else {
        // If no UID found, include it (backward compatible)
        visibilityFiltered.push(master);
      }
    }

    return visibilityFiltered;
  } catch (error) {
    console.error("Error fetching public masters:", error);
    throw error;
  }
}

// Fetch public listings with filters
export async function fetchPublicListings(
  filters: Partial<SearchFiltersValue>,
  limitCount: number = 50
): Promise<Listing[]> {
  const db = requireDb();

  try {
    const filterArray: any[] = [];

    if (filters.city) {
      filterArray.push(where("city", "==", filters.city));
    }

    if (filters.service) {
      filterArray.push(where("services", "array-contains", filters.service));
    }

    if (filters.languages && filters.languages.length > 0) {
      filterArray.push(
        where("languages", "array-contains-any", filters.languages)
      );
    }

    const col = collection(db, "listings");
    const q = query(
      col,
      ...filterArray,
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return (
      querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Filter out deleted listings
        .filter((listing: any) => !listing.deleted) as Listing[]
    );
  } catch (error) {
    console.error("Error fetching public listings:", error);
    throw error;
  }
}

// Create a new master listing
export async function createMaster(data: any): Promise<string> {
  const db = requireDb();

  try {
    const col = collection(db, "masters");
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(col, payload);
    return docRef.id;
  } catch (error) {
    console.error("Error creating master listing:", error);
    throw error;
  }
}

// Update a master listing
export async function updateMaster(
  id: string,
  partial: Partial<Master>
): Promise<void> {
  const db = requireDb();

  try {
    const docRef = doc(db, "masters", id);
    const updateData = stripUndefined({
      ...partial,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating master listing:", error);
    throw error;
  }
}

// Delete a master listing
export async function deleteMaster(id: string): Promise<void> {
  const db = requireDb();

  try {
    const docRef = doc(db, "masters", id);
    await updateDoc(docRef, { deleted: true, deletedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error removing master listing:", error);
    throw error;
  }
}

// Delete a listing
export async function deleteListing(id: string): Promise<void> {
  const db = requireDb();

  try {
    const docRef = doc(db, "listings", id);
    await updateDoc(docRef, { deleted: true, deletedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error removing listing:", error);
    throw error;
  }
}

// Save master profile
type CityObj = { name: string; placeId?: string } | null;

type MasterProfilePayload = {
  name: string;
  about: string;
  city: string | CityObj;
  services: string[];
  languages: string[];
  avatarUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  experience?: number;
  education?: string;
  certifications?: string[];
  specialties?: string[];
  priceRange?: {
    min: number | null;
    max: number | null;
  };
  availability?: string;
  travelRadius?: number;
  responseTime?: string;
  cancellationPolicy?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  paymentMethods?: string[];
  insurance?: boolean;
  portfolio?: string[];
  testimonials?: Array<{
    name: string;
    text: string;
    rating: number;
    date: Date;
  }>;
  awards?: string[];
  press?: string[];
  socialProof?: {
    followers?: number;
    reviews?: number;
    rating?: number;
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  location?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  preferences?: {
    clientTypes?: string[];
    serviceTypes?: string[];
    workingHours?: string[];
    travelPreferences?: string[];
    communicationPreferences?: string[];
  };
  settings?: {
    profileVisibility?: "public" | "private" | "unlisted";
    notificationSettings?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    privacySettings?: {
      showPhone?: boolean;
      showEmail?: boolean;
      showLocation?: boolean;
    };
  };
};

// Normalize city data before saving to Firestore
function normalizeCity(c: string | CityObj): CityObj {
  if (!c) return null;
  if (typeof c === "string") return { name: c };
  return c; // already object {name, placeId?}
}

export async function saveMasterProfile(
  uid: string,
  data: MasterProfilePayload
): Promise<void> {
  const db = requireDb();

  try {
    const ref = doc(db, "masters", uid); // one profile per master
    const payload: any = {
      name: data.name,
      about: data.about,
      city: normalizeCity(data.city),
      services: data.services,
      languages: data.languages,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      email: data.email,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      twitter: data.twitter,
      linkedin: data.linkedin,
      youtube: data.youtube,
      tiktok: data.tiktok,
      experience: data.experience,
      education: data.education,
      certifications: data.certifications,
      specialties: data.specialties,
      priceRange: data.priceRange,
      availability: data.availability,
      travelRadius: data.travelRadius,
      responseTime: data.responseTime,
      cancellationPolicy: data.cancellationPolicy,
      depositRequired: data.depositRequired,
      depositAmount: data.depositAmount,
      paymentMethods: data.paymentMethods,
      insurance: data.insurance,
      portfolio: data.portfolio,
      testimonials: data.testimonials,
      awards: data.awards,
      press: data.press,
      socialProof: data.socialProof,
      businessHours: data.businessHours,
      location: data.location,
      contactInfo: data.contactInfo,
      preferences: data.preferences,
      settings: data.settings,
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error("Error saving master profile:", error);
    throw error;
  }
}

// Helper functions for the examples you provided
export async function fetchMastersLatest(opts?: {
  limitTo?: number;
  city?: string;
  service?: string;
}) {
  const db = requireDb();
  const col = collection(db, "masters");

  const parts: any[] = [];
  if (opts?.city) parts.push(where("city", "==", opts.city));
  if (opts?.service)
    parts.push(where("services", "array-contains", opts.service));
  parts.push(orderBy("createdAt", "desc"));
  if (opts?.limitTo) parts.push(limit(opts.limitTo));

  const q = query(col, ...parts);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getMaster(id: string) {
  const db = requireDb();
  const ref = doc(db, "masters", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null;
}
