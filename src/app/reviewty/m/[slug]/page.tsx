'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { CommunityMaster } from '@/types/community';

export default function CommunityMasterPage() {
 const params = useParams();
 const slug = params?.slug as string;
 const [master, setMaster] = useState<CommunityMaster | null>(null);
 const [reviews, setReviews] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function load() {
 if (!slug) return;
 try {
 // Load community master by slug
 const mastersQuery = query(collection(db, 'community_masters'), where('slug', '==', slug));
 const mastersSnap = await getDocs(mastersQuery);
 if (mastersSnap.empty) {
 setLoading(false);
 return;
 }
 const masterData = { id: mastersSnap.docs[0].id, ...mastersSnap.docs[0].data() } as CommunityMaster;
 setMaster(masterData);

 // Load reviews for this community master
 const reviewsQuery = query(
 collection(db, 'reviews'),
 where('masterRef.type', '==', 'community'),
 where('masterRef.slug', '==', slug),
 where('isPublic', '==', true)
 );
 const reviewsSnap = await getDocs(reviewsQuery);
 const reviewsData = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
 setReviews(reviewsData);
 } catch (error) {
 console.error('Error loading community master:', error);
 } finally {
 setLoading(false);
 }
 }
 load();
 }, [slug]);

 if (loading) return <div className="p-6 text-center">Loading...</div>;
 if (!master) return <div className="p-6 text-center text-gray-500">Community master not found</div>;

 const avgRating = reviews.length > 0 
 ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
 : 0;

 return (
 <div className="max-w-4xl mx-auto p-6 space-y-6">
 <div className="rounded-xl border bg-white p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-semibold">{master.displayName}</h1>
 <button
 onClick={() => window.dispatchEvent(new CustomEvent('reviewty:openCreate', { detail: { mode: 'community', preset: master } }))}
 className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
 >
 Оставить отзыв
 </button>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <div className="text-gray-600">Город</div>
 <div className="font-medium">{master.city}</div>
 </div>
 <div>
 <div className="text-gray-600">Услуги</div>
 <div className="flex flex-wrap gap-2 mt-1">
 {master.services?.map((service, i) => (
 <span key={i} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
 {service}
 </span>
 ))}
 </div>
 </div>
 </div>

 {master.contact && (
 <div className="space-y-2">
 <div className="text-gray-600">Контакты</div>
 <div className="flex flex-wrap gap-4">
 {master.contact.phone && <div>📞 {master.contact.phone}</div>}
 {master.contact.instagram && <div>📷 {master.contact.instagram}</div>}
 {master.contact.tiktok && <div>🎵 {master.contact.tiktok}</div>}
 </div>
 </div>
 )}

 <div className="flex items-center gap-4">
 <div className="text-2xl font-semibold">{avgRating}/5</div>
 <div className="text-yellow-400">{'★'.repeat(Math.round(avgRating))}</div>
 <div className="text-gray-500">{reviews.length} отзывов</div>
 </div>
 </div>

 <div className="space-y-4">
 <h2 className="text-xl font-semibold">Отзывы</h2>
 {reviews.length === 0 ? (
 <div className="text-center text-gray-500 py-8">Пока нет отзывов</div>
 ) : (
 <ul className="space-y-4">
 {reviews.map((review) => (
 <li key={review.id} className="rounded-xl border bg-white p-4 space-y-3">
 <div className="flex items-center justify-between">
 <div className="text-yellow-400">{'★'.repeat(review.rating || 0)}</div>
 <div className="text-sm text-gray-500">
 {review.createdAt?.toDate?.()?.toLocaleDateString() || 'Недавно'}
 </div>
 </div>
 <p className="text-gray-800">{review.text}</p>
 {review.photos?.length > 0 && (
 <div className="flex gap-2">
 {review.photos.slice(0, 3).map((photo: any, i: number) => (
 // eslint-disable-next-line @next/next/no-img-element
 <img key={i} src={photo.url} alt={`review photo ${i+1}`} className="h-24 w-24 object-cover rounded" />
 ))}
 </div>
 )}
 </li>
 ))}
 </ul>
 )}
 </div>
 </div>
 );
}
