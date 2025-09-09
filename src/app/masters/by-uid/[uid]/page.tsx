import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import MasterCard from '@/components/MasterCard';

type MasterProfile = {
  uid: string;
  displayName: string;
  city: string;
  services: string[];
  languages: string[];
  avatarUrl: string | null;
  updatedAt?: unknown;
  createdAt?: unknown;
};

export default async function PublicMasterPage({ params }: { params: { uid: string } }) {
  if (!db) {
    if (process.env.NODE_ENV !== "production") console.warn("Firestore is not initialized (missing env).");
    notFound();
  }
  
  const snap = await getDoc(doc(db, 'masters', params.uid));
  
  if (!snap.exists()) {
    notFound();
  }
  
  const master = snap.data() as MasterProfile;
  
  // Transform to match MasterCard expected format
  const masterForCard = {
    id: params.uid,
    uid: params.uid,
    title: master.displayName,
    displayName: master.displayName,
    name: master.displayName,
    city: master.city,
    services: master.services,
    languages: master.languages,
    photos: master.avatarUrl ? [master.avatarUrl] : [],
    photoUrls: master.avatarUrl ? [master.avatarUrl] : [],
    photo: master.avatarUrl,
    rating: undefined,
    ratingAvg: undefined,
    reviewsCount: undefined,
    status: 'active' as const,
    createdAt: master.createdAt,
    updatedAt: master.updatedAt,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Master Profile</h1>
          <p className="text-gray-600">Viewing public profile</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <MasterCard master={masterForCard} />
        </div>
      </div>
    </div>
  );
}
