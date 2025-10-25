"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { SafeText } from "@/lib/safeText";
import { safeImageSrc } from "@/lib/safeImage";
import Image from "next/image";
import DeleteButton from "@/components/listings/DeleteButton";
import DashboardListingCard from "./DashboardListingCard";

type Listing = {
  id: string;
  title: string;
  city?: string;
  cityName?: string;
  services?: string[];
  serviceNames?: string[];
  languages?: string[];
  languageNames?: string[];
  priceFrom?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  status?: "active" | "draft";
  photos?: { url: string; path: string }[];
};

export default function MyListingsPage() {
  const { user, loading } = useAuthUser();
  const [items, setItems] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  function handleDelete(listingId: string) {
    // NOTE: we assume listings are stored in "listings" or "publicListings".
    // Use the SAME collection name you query in useEffect for fetching.
    // For example, if useEffect uses collection(db, "listings"), then use that here.
    const COL = "listings"; // <-- IMPORTANT: set this EXACTLY to the collection you're actually querying.
    const ref = doc(db, COL, listingId);
    deleteDoc(ref)
      .then(() => {
        console.log("[DashboardListings] deleted listing", listingId);
      })
      .catch((err) => {
        console.error("[DashboardListings] delete error:", err);
        alert("Failed to delete listing. Check console.");
      });
  }

  useEffect(() => {
    if (!loading && user) {
      // fetch listings owned by this user.uid using the same logic as profile pages
      setListingsLoading(true);

      async function fetchListingsForUser() {
        if (!user) return;

        const candidates = [
          ["masterUid", user.uid],
          ["ownerUid", user.uid],
          ["authorUid", user.uid],
          ["userUid", user.uid],
          ["profileId", user.uid],
        ];
        const results: Record<string, Listing> = {};

        for (const [field, value] of candidates) {
          try {
            const q = query(
              collection(db, "listings"),
              where(field as any, "==", value)
            );
            const snap = await getDocs(q);
            snap.forEach((d) => {
              results[d.id] = { id: d.id, ...d.data() } as Listing;
            });
          } catch (err) {
            console.warn(`Failed to query listings by ${field}:`, err);
          }
        }

        const allListings = Object.values(results);
        // Sort by updatedAt descending
        allListings.sort((a, b) => {
          const aTime =
            (a as any).updatedAt?.toMillis?.() || (a as any).updatedAt || 0;
          const bTime =
            (b as any).updatedAt?.toMillis?.() || (b as any).updatedAt || 0;
          return bTime - aTime;
        });

        setItems(allListings);
        setListingsLoading(false);
      }

      fetchListingsForUser();
    }
  }, [loading, user]);

  // RENDER LOGIC:
  if (loading) {
    return (
      <section className="p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2">My listings</h1>
        <p className="text-sm text-gray-500">Loading your account…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="p-4 md:p-6">
        <h1 className="text-xl font-semibold mb-2">My listings</h1>
        <p className="text-sm text-gray-500">
          Please sign in to view your listings.
        </p>
      </section>
    );
  }

  // user is present
  return (
    <section className="p-4 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <h1 className="text-xl font-semibold">My listings</h1>

        {user && (
          <a
            href="/dashboard/master/listings/new"
            className="inline-flex items-center rounded-md bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            + Add listing
          </a>
        )}
      </div>

      {listingsLoading ? (
        <p className="text-sm text-gray-500">Loading listings…</p>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">
          You don't have any listings yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((lst) => (
            <DashboardListingCard
              key={lst.id}
              listing={lst}
              onDelete={(id) => {
                handleDelete(id);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
