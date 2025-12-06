import { getAdminDb } from "@/lib/firebaseAdmin";
import { notFound } from "next/navigation";
import MasterCard from "@/components/MasterCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// Next.js 15: params is now a Promise and must be awaited in async components
export default async function PublicMasterPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  try {
    const { uid } = await params;
    const adminDb = getAdminDb();
    if (!adminDb) {
      notFound();
    }

    const snap = await adminDb.collection("masters").doc(uid).get();

    if (!snap.exists) {
      notFound();
    }

    const master = snap.data() as MasterProfile;

    // Transform to match MasterCard expected format
    const masterForCard = {
      id: uid,
      uid: uid,
      ownerId: uid, // Add missing ownerId property
      title: master.displayName,
      displayName: master.displayName,
      name: master.displayName,
      city: master.city,
      services: master.services,
      languages: master.languages,
      photos: master.avatarUrl ? [master.avatarUrl] : [],
      photoUrls: master.avatarUrl ? [master.avatarUrl] : [],
      photo: master.avatarUrl || undefined,
      rating: undefined,
      ratingAvg: undefined,
      reviewsCount: undefined,
      status: "active" as const,
      createdAt: master.createdAt,
      updatedAt: master.updatedAt,
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Master Profile
            </h1>
            <p className="text-gray-600">Viewing public profile</p>
          </div>

          <div className="max-w-md mx-auto">
            <MasterCard master={masterForCard} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading master profile:", error);
    notFound();
  }
}
