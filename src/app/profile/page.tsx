"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
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

type MasterProfile = {
  uid: string;
  displayName?: string;
  cityName?: string;
  city?: string;
  languagesNames?: string[]; // adapt to your schema
  servicesNames?: string[]; // adapt to your schema
  photoURL?: string;
};

export default function PublicProfilePage() {
  const db = getFirestore(app);
  const { user, loading } = useAuthUser();

  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // 1. load profile document for this user
  useEffect(() => {
    if (!user || loading) return;
    const ref = doc(db, "profiles", user.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setProfile({ ...data, uid: user.uid });
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.warn("[PublicProfilePage] profile error:", err);
        setProfile(null);
        setProfileLoading(false);
      }
    );

    return () => unsub();
  }, [user, loading, db]);

  // 2. load listings owned by this user
  useEffect(() => {
    if (!user || loading) return;

    // IMPORTANT:
    // Use EXACTLY the same collection name and owner field that we use
    // in /dashboard/master/listings page to fetch this master's listings.
    //
    // Example:
    // const qListings = query(
    //   collection(db, "listings"),
    //   where("masterId", "==", user.uid)
    // );
    //
    // If in dashboard we used "publicListings" and "ownerUid", mirror that here.
    //
    // ↓↓↓ ADAPT THIS to match dashboard/master/listings query ↓↓↓
    const qListings = query(
      collection(db, "listings"),
      where("masterId", "==", user.uid)
    );
    // ↑↑↑ make sure this matches dashboard query (same collection + same field)

    const unsub = onSnapshotCol(
      qListings,
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => {
          arr.push({ id: d.id, ...d.data() });
        });
        setListings(arr);
        setListingsLoading(false);
      },
      (err) => {
        console.error("[PublicProfilePage] listings error:", err);
        setListings([]);
        setListingsLoading(false);
      }
    );

    return () => unsub();
  }, [user, loading, db]);

  // RENDER --------------------------------------------------

  // Loading overall auth?
  if (loading) {
    return (
      <section className="p-4 md:p-6">
        <p className="text-sm text-gray-500">Loading your profile…</p>
      </section>
    );
  }

  // No user logged in
  if (!user) {
    return (
      <section className="p-4 md:p-6">
        <p className="text-sm text-gray-500">
          Please sign in to view your profile.
        </p>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* HEADER: avatar + name + city + services + languages */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-pink-200 overflow-hidden flex items-center justify-center text-pink-800 font-semibold text-lg">
            {profile?.photoURL ? (
              // real avatar photo if you store it
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoURL}
                alt={profile.displayName || "avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              (
                profile?.displayName?.[0] ||
                user.email?.[0] ||
                "•"
              ).toUpperCase()
            )}
          </div>

          <div className="flex flex-col">
            <div className="text-lg font-semibold text-gray-900 leading-tight">
              {profile?.displayName || "Unnamed master"}
            </div>

            {(profile?.cityName || profile?.city) && (
              <div className="text-sm text-gray-600 leading-tight">
                {profile?.cityName || profile?.city}
              </div>
            )}

            {profile?.servicesNames && profile.servicesNames.length > 0 && (
              <div className="text-sm text-gray-800 leading-tight">
                <span className="font-medium text-gray-900">Services:</span>{" "}
                {profile.servicesNames.join(", ")}
              </div>
            )}

            {profile?.languagesNames && profile.languagesNames.length > 0 && (
              <div className="text-sm text-gray-800 leading-tight">
                <span className="font-medium text-gray-900">Languages:</span>{" "}
                {profile.languagesNames.join(", ")}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row gap-2">
          <a
            href="/dashboard/master/listings"
            className="inline-flex items-center rounded-md bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            Edit Profile / Listings
          </a>
        </div>
      </div>

      {/* LISTINGS GRID */}
      <div className="mb-3 text-base font-semibold text-gray-900">
        My Listings
      </div>

      {listingsLoading ? (
        <p className="text-sm text-gray-500">Loading listings…</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-gray-500">
          You don't have any listings yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((lst) => (
            <DashboardListingCard key={lst.id} listing={lst} />
          ))}
        </div>
      )}
    </section>
  );
}
