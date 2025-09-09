import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createListing(listingRef: ReturnType<typeof doc>, userUid: string, data: any) {
  const payload = {
    title: data.title.trim(),
    city: data.city,
    services: data.services, // string[]
    languages: data.languages, // string[]
    minPrice: data.minPrice ?? null,
    maxPrice: data.maxPrice ?? null,
    description: data.description ?? "",
    photos: data.photos ?? [], // [{url,path,w,h}]
    status: data.status ?? "draft", // "draft" or "published"
    ownerUid: userUid, // REQUIRED by rules
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  console.info("[BR][CreateListing] Saving with payload:", { 
    ownerUid: payload.ownerUid, 
    status: payload.status, 
    photosCount: payload.photos.length 
  });
  
  await setDoc(listingRef, payload, { merge: false });
}

export async function updateListing(listingRef: ReturnType<typeof doc>, userUid: string, data: any) {
  const payload = {
    title: data.title.trim(),
    city: data.city,
    services: data.services,
    languages: data.languages,
    minPrice: data.minPrice ?? null,
    maxPrice: data.maxPrice ?? null,
    description: data.description ?? "",
    photos: data.photos ?? [],
    status: data.status ?? "draft",
    ownerUid: userUid, // keep invariant for rules
    updatedAt: serverTimestamp(),
  };
  
  console.info("[BR][UpdateListing] Updating with payload:", { 
    ownerUid: payload.ownerUid, 
    status: payload.status, 
    photosCount: payload.photos.length 
  });
  
  await updateDoc(listingRef, payload);
}

export async function deleteListingCascade(listingId: string) {
  const listingRef = doc(db, "listings", listingId);
  
  console.info("[BR][DeleteListing] Deleting listing:", listingId);
  
  await deleteDoc(listingRef);
}