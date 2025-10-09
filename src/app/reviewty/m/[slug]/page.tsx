'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import type { CommunityMaster } from '@/types/community';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';

console.log("db?", !!db);

export default function CommunityMasterPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [master, setMaster] = useState<CommunityMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewKey, setReviewKey] = useState(0);

  // Extract masterId from slug (e.g., "m-city-xxxx" -> "xxxx")
  const masterId = slug ? slug.split('-').pop() : '';

  const handleReviewSubmitted = useCallback(() => {
    setReviewKey(k => k + 1);
  }, []);

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

 return (
 <div className="max-w-4xl mx-auto p-6 space-y-6">
 <div className="rounded-xl border bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{master.displayName}</h1>
        </div>

 <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-gray-600">City</div>
          <div className="font-medium">{master.city}</div>
        </div>
        <div>
          <div className="text-gray-600">Services</div>
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
            <div className="text-gray-600">Contacts</div>
            <div className="flex flex-wrap gap-4">
              {master.contact.phone && <div>📞 {master.contact.phone}</div>}
              {master.contact.instagram && <div>📷 {master.contact.instagram}</div>}
              {master.contact.tiktok && <div>🎵 {master.contact.tiktok}</div>}
            </div>
          </div>
        )}

      </div>

      {/* Reviews Section */}
      {masterId && (
        <>
          <ReviewForm subjectType="master" subjectId={masterId} onSubmitted={handleReviewSubmitted} />
          <ReviewList key={reviewKey} subjectType="master" subjectId={masterId} />
        </>
      )}
    </div>
  );
}
