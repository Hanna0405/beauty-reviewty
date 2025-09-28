'use client';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import type { Review } from '@/types/reviews';

export function listenPublicReviews(listingId: string, cb: (items: Review[]) => void) {
 const q = query(
 collection(db, 'reviews'),
 where('listingId', '==', listingId),
 where('isPublic', '==', true),
 );
 return onSnapshot(q, (snap) => {
 const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
 items.sort((a: any, b: any) => (b?.createdAt?.toMillis?.() ?? 0) - (a?.createdAt?.toMillis?.() ?? 0));
 cb(items as Review[]);
 });
}

export async function createReview(payload: {
 listingId: string;
 authorId: string; // MUST be auth.uid
 rating: 1|2|3|4|5;
 text: string;
 photos: { url: string; path: string }[];
 isPublic?: boolean;
 // Denormalized fields
 city?: string;
 services?: string[];
 languages?: string[];
 masterRef?: { type: 'listing'|'community', id: string, slug?: string, listingId?: string };
}) {
 const docData = {
 listingId: payload.listingId,
 authorId: payload.authorId,
 rating: Number(payload.rating) as 1|2|3|4|5,
 text: (payload.text || '').trim(),
 photos: (payload.photos || []).slice(0, 3),
 isPublic: payload.isPublic ?? true,
 // Denormalized fields
 city: payload.city || null,
 services: payload.services || null,
 languages: payload.languages || null,
 masterRef: payload.masterRef || null,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 };
 console.info('[Review][create] payload', { ...docData, createdAt: 'ts', updatedAt: 'ts' });
 return await addDoc(collection(db, 'reviews'), docData as any);
}

export async function updateReview(id: string, patch: Partial<Pick<Review,'rating'|'text'|'photos'|'isPublic'>>) {
 await updateDoc(doc(db, 'reviews', id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteReview(id: string) {
 await deleteDoc(doc(db, 'reviews', id));
}

// Reuse existing Admin upload route with reviews folder
async function uploadReviewPhoto(file: File) {
 const fd = new FormData();
 fd.append('file', file);
 const res = await fetch('/api/upload?folder=reviews', { method: 'POST', body: fd });
 if (!res.ok) throw new Error('Upload failed');
 return res.json() as Promise<{ url: string; path: string }>;
}

export { uploadReviewPhoto };
