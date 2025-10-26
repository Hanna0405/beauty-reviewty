"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  onSnapshot as onSnapshotCol,
} from "firebase/firestore";
import { app } from "@/lib/firebase.client";
import DashboardListingCard from "@/app/dashboard/master/listings/DashboardListingCard";

export default function PublicMasterPage() {
  const db = getFirestore(app);
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [profile, setProfile] = useState<any | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load profile by UID from route param
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "profiles", uid as string);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      else setProfile(null);
      setLoading(false);
    });
    return () => unsub();
  }, [uid, db]);

  // 2. Load listings owned by this master (by masterId or uid)
  useEffect(() => {
    if (!uid) return;
    const qListings = query(
      collection(db, "listings"),
      where("masterId", "==", uid)
    );
    const unsub = onSnapshotCol(qListings, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setListings(arr);
    });
    return () => unsub();
  }, [uid, db]);

  if (loading) return <p className="p-4 text-gray-500">Loading…</p>;
  if (!profile) return <p className="p-4 text-gray-500">Profile not found.</p>;

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">
        {profile.displayName || "Unnamed master"}
      </h1>
      {profile.cityName && (
        <p className="text-sm text-gray-600 mb-4">{profile.cityName}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((lst) => (
          <DashboardListingCard key={lst.id} listing={lst} />
        ))}
      </div>
    </section>
  );
}
