"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";

import { requireDb, requireStorage } from "@/lib/firebase";
import { useCurrentUserOrRedirect } from "@/hooks/useCurrentUserOrRedirect";

type MasterProfile = {
 uid: string;
 displayName: string;
 city?: string;
 services?: string[];
 serviceNames?: string[];
 languages?: string[];
 languageNames?: string[];
 avatarUrl?: string | null;
 socials?: {
  instagram?: string;
  facebook?: string;
  website?: string;
 };
 updatedAt?: unknown;
};

export default function MasterProfilePage() {
 const { user, loading: authLoading } = useCurrentUserOrRedirect();
 const [profile, setProfile] = useState<MasterProfile | null>(null);
 const [loading, setLoading] = useState(true);
 const [deleting, setDeleting] = useState(false);
 const router = useRouter();

 useEffect(() => {
 if (!user?.uid) return;

 try {
 requireDb();
 } catch {
 setLoading(false);
 return;
 }

 const unsub = onSnapshot(
  doc(requireDb(), "profiles", user.uid),
  (snap) => {
  if (snap.exists()) {
  setProfile({ uid: user.uid, ...(snap.data() as any) });
  } else {
  // fallback
  setProfile({
  uid: user.uid,
  displayName: user.email ?? "My profile",
  });
  }
  setLoading(false);
  },
  () => setLoading(false)
 );

 return () => unsub();
 }, [user?.uid]);

 async function handleDelete() {
 if (!user?.uid) return;
 if (!confirm("Delete this profile?")) return;
 setDeleting(true);
 try {
 const db = requireDb();
 await deleteDoc(doc(db, "profiles", user.uid));
 // try to delete from masters too
 try {
  await deleteDoc(doc(db, "masters", user.uid));
 } catch {}
 // storage cleanup
 try {
  const storage = requireStorage();
  const baseRef = ref(storage, `profiles/${user.uid}`);
  const list = await listAll(baseRef);
  await Promise.all(list.items.map((i) => deleteObject(i)));
 } catch {}
 router.push("/dashboard/master");
 } finally {
 setDeleting(false);
 }
 }

 if (authLoading || loading) {
 return (
 <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
  Loading profile…
 </div>
 );
 }

 const displayName =
  profile?.displayName || user?.email || "Your profile";
 const city = profile?.city || "City not set";
 const services =
  profile?.serviceNames?.length
  ? profile.serviceNames
  : profile?.services || [];
 const languages =
  profile?.languageNames?.length
  ? profile.languageNames
  : profile?.languages || [];

 // IMPORTANT: fix 404 — go to /master/{uid}
 const viewHref = `/master/${user?.uid ?? profile?.uid ?? ""}`;

 return (
 <div className="min-h-[60vh] bg-pink-50/40">
 <div className="mx-auto max-w-5xl px-4 py-8">
  <div className="flex items-center justify-between mb-6">
  <div>
   <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
   <p className="text-sm text-gray-500">
   Manage your profile information and social links
   </p>
  </div>
  <Link
   href="/dashboard/master"
   className="text-sm text-pink-600 hover:text-pink-700"
  >
   ← Back to Dashboard
  </Link>
  </div>

  <div className="rounded-xl bg-white border border-pink-100 shadow-sm overflow-hidden">
  {/* Header */}
  <div className="bg-gradient-to-r from-pink-100 via-pink-50 to-white px-6 py-5 flex items-center gap-4">
   <div className="h-16 w-16 rounded-full bg-pink-200 flex items-center justify-center overflow-hidden ring-2 ring-white">
   {profile?.avatarUrl ? (
   <img
   src={profile.avatarUrl}
   alt={displayName}
   className="h-full w-full object-cover"
   />
   ) : (
   <span className="text-xl font-medium text-pink-700">
   {displayName.charAt(0).toUpperCase()}
   </span>
   )}
   </div>
   <div className="flex-1">
   <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
   <p className="flex items-center gap-1 text-sm text-gray-500">
   <span className="text-pink-500">●</span> {city}
   </p>
   </div>
   <div className="flex gap-2">
   <Link
   href="/dashboard/master/profile/edit"
   className="px-4 py-2 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700"
   >
   Edit profile
   </Link>
   <Link
   href={viewHref}
   className="px-4 py-2 text-sm bg-white text-pink-700 border border-pink-200 rounded-md hover:bg-pink-50"
   >
   View
   </Link>
   <button
   onClick={handleDelete}
   className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-100"
   >
   Delete
   </button>
   </div>
  </div>

  {/* Body */}
  <div className="px-6 py-5 grid gap-6 md:grid-cols-3">
  <div className="md:col-span-2 space-y-4">
   <div>
   <h3 className="text-sm font-semibold text-gray-700 mb-2">
   Services
   </h3>
   {services.length ? (
   <div className="flex flex-wrap gap-2">
   {services.map((s) => (
   <span
   key={s}
   className="inline-flex items-center gap-1 rounded-full bg-pink-50 text-pink-800 px-3 py-1 text-xs border border-pink-100"
   >
   {s}
   </span>
   ))}
   </div>
   ) : (
   <p className="text-sm text-gray-400">No services selected</p>
   )}
   </div>
   <div>
   <h3 className="text-sm font-semibold text-gray-700 mb-2">
   Languages
   </h3>
   {languages.length ? (
   <div className="flex flex-wrap gap-2">
   {languages.map((l) => (
   <span
   key={l}
   className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-800 px-3 py-1 text-xs border border-violet-100"
   >
   {l}
   </span>
   ))}
   </div>
   ) : (
   <p className="text-sm text-gray-400">No languages selected</p>
   )}
   </div>
  </div>
  <div className="space-y-3">
   <h3 className="text-sm font-semibold text-gray-700">
   Social links
   </h3>
   <div className="space-y-2 text-sm">
   {profile?.socials?.instagram ? (
   <a
   href={profile.socials.instagram}
   target="_blank"
   rel="noreferrer"
   className="block text-pink-600 hover:underline"
   >
   Instagram
   </a>
   ) : (
   <p className="text-gray-400 text-sm">No Instagram added</p>
   )}
   {profile?.socials?.facebook ? (
   <a
   href={profile.socials.facebook}
   target="_blank"
   rel="noreferrer"
   className="block text-pink-600 hover:underline"
   >
   Facebook
   </a>
   ) : null}
   {profile?.socials?.website ? (
   <a
   href={profile.socials.website}
   target="_blank"
   rel="noreferrer"
   className="block text-pink-600 hover:underline"
   >
   Website
   </a>
   ) : null}
   </div>
  </div>
  </div>
 </div>
 </div>

 {deleting ? (
 <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
  <div className="bg-white rounded-md px-6 py-4 text-sm">
  Deleting profile…
  </div>
 </div>
 ) : null}
 </div>
 );
}
