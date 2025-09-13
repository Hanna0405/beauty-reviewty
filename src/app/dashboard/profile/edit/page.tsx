"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

// ---- Adjust these imports to your project paths if they differ ----
import { requireAuth, requireDb, requireStorage } from "@/lib/firebase"; // must export initialized Firebase Auth
import {
 doc,
 getDoc,
 setDoc,
 serverTimestamp,
} from "firebase/firestore";
import { uploadImage } from "@/lib/upload-image";

// Try to use our CityAutocomplete if present; otherwise fallback will be used.
let CityAutocomplete: React.ComponentType<{
 value: string;
 onChange: (v: string) => void;
 placeholder?: string;
 className?: string;
}> | null = null;
try {
 CityAutocomplete = require("@/components/CityAutocomplete").default;
} catch (_) {
 CityAutocomplete = null;
}

type MasterProfile = {
 uid: string;
 displayName: string;
 city: string;
 services: string[];
 languages: string[];
 avatarUrl: string | null;
 updatedAt?: unknown;
};

const emptyProfile = (uid: string): MasterProfile => ({
 uid,
 displayName: "",
 city: "",
 services: [],
 languages: [],
 avatarUrl: null,
});

export default function EditProfilePage() {
 const router = useRouter();
 const auth = requireAuth();
 const user = auth.currentUser;
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState<MasterProfile>(
 emptyProfile(user?.uid || "")
 );

 const [avatarFile, setAvatarFile] = useState<File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
 const uid = useMemo(() => user?.uid ?? "", [user]);

 useEffect(() => {
 let revoked = false;
 async function load() {
 if (!uid) return;
 setLoading(true);
 setError(null);
 try {
 const db = requireDb();
 const snap = await getDoc(doc(db, "masters", uid));
 if (snap.exists()) {
 const data = snap.data() as Partial<MasterProfile>;
 const safe: MasterProfile = {
 uid,
 displayName: (data.displayName ?? "") as string,
 city: (data.city ?? "") as string,
 services: Array.isArray(data.services) ? (data.services as string[]) : [],
 languages: Array.isArray(data.languages) ? (data.languages as string[]) : [],
 avatarUrl: (data.avatarUrl ?? null) as string | null,
 updatedAt: data.updatedAt,
 };
 if (!revoked) setForm(safe);
 } else {
 if (!revoked) setForm(emptyProfile(uid));
 }
 } catch (e: any) {
 if (!revoked) setError(e?.message || "Failed to load profile");
 } finally {
 if (!revoked) setLoading(false);
 }
 }
 load();
 return () => {
 revoked = true;
 if (avatarPreview) URL.revokeObjectURL(avatarPreview);
 };
 }, [uid]);

 function setField<K extends keyof MasterProfile>(key: K, value: MasterProfile[K]) {
 setForm((prev) => ({ ...prev, [key]: value }));
 }

 function addChip(key: "services" | "languages", value: string) {
 value = value.trim();
 if (!value) return;
 setForm((prev) => {
 const arr = new Set([...(prev[key] || []), value]);
 return { ...prev, [key]: Array.from(arr) };
 });
 }

 function removeChip(key: "services" | "languages", value: string) {
 setForm((prev) => ({
 ...prev,
 [key]: (prev[key] || []).filter((v) => v !== value),
 }));
 }

 function onAvatarChange(file: File | null) {
 setAvatarFile(file);
 if (avatarPreview) URL.revokeObjectURL(avatarPreview);
 if (file) setAvatarPreview(URL.createObjectURL(file));
 else setAvatarPreview(null);
 }

 function validate(p: MasterProfile): string[] {
 const errs: string[] = [];
 if (!p.displayName.trim()) errs.push("Display name is required.");
 if (!p.city.trim()) errs.push("City is required.");
 if (!p.services || p.services.length === 0) errs.push("Add at least one service.");
 if (!p.languages || p.languages.length === 0) errs.push("Add at least one language.");
 return errs;
 }

 async function onSave(profileData: any) {
 const db = requireDb();
 await setDoc(doc(db, "profiles", uid), profileData, { merge: true });
 router.refresh(); // force revalidate
 }

 async function handleSave(e: React.FormEvent) {
 e.preventDefault();
 if (!uid) {
 setError("No authenticated user.");
 return;
 }
 const errs = validate(form);
 if (errs.length) {
 setError(errs.join(" "));
 return;
 }

 setSaving(true);
 setError(null);

 try {
 let avatarUrl: string | null = form.avatarUrl ?? null;

 if (avatarFile) {
 const path = `profiles/${uid}/avatar-${Date.now()}.jpg`;
 const { url } = await uploadImage(avatarFile, path);
 avatarUrl = url;
 }

 const payload: MasterProfile = {
 uid,
 displayName: form.displayName.trim(),
 city: form.city.trim(),
 services: form.services.map((s) => s.trim()).filter(Boolean),
 languages: form.languages.map((l) => l.trim()).filter(Boolean),
 avatarUrl: avatarUrl ?? null,
 updatedAt: serverTimestamp(),
 };

 await onSave(payload);
 alert("Profile saved ");
 } catch (e: any) {
 console.error(e);
 setError(e?.message || "Failed to save profile.");
 } finally {
 setSaving(false);
 }
 }

 function ChipEditor({
 label,
 value,
 onAdd,
 onRemove,
 placeholder,
 }: {
 label: string;
 value: string[];
 onAdd: (v: string) => void;
 onRemove: (v: string) => void;
 placeholder: string;
 }) {
 const [input, setInput] = useState("");
 return (
 <div className="grid gap-2">
 <label className="text-sm font-medium">{label}</label>
 <div className="flex gap-2">
 <input
 className="flex-1 rounded border px-3 py-2"
 placeholder={placeholder}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 onAdd(input);
 setInput("");
 }
 }}
 />
 <button
 type="button"
 className="rounded bg-black px-3 py-2 text-white"
 onClick={() => {
 onAdd(input);
 setInput("");
 }}
 >
 Add
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {value.map((v) => (
 <span
 key={v}
 className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
 >
 {v}
 <button
 type="button"
 className="text-red-600"
 onClick={() => onRemove(v)}
 aria-label={`Remove ${v}`}
 >
 ×
 </button>
 </span>
 ))}
 </div>
 </div>
 );
 }

 if (!uid) {
 return (
 <div className="mx-auto max-w-2xl p-6">
 <h1 className="mb-4 text-2xl font-semibold">Edit Profile</h1>
 <p className="text-red-600">Please sign in to edit your profile.</p>
 </div>
 );
 }

 return (
 <div className="mx-auto max-w-2xl p-6">
 <div className="mb-6 flex items-center justify-between">
 <h1 className="text-2xl font-semibold">Edit Profile</h1>
 <a href="/dashboard/master/profile" className="text-sm text-pink-600 hover:underline">
 ← Back to Profile
 </a>
 </div>

 {loading ? (
 <div className="rounded border p-6">Loading…</div>
 ) : (
 <form onSubmit={handleSave} className="grid gap-5 rounded border p-6">
 {error && (
 <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
 {error}
 </div>
 )}

 {/* Avatar */}
 <div className="grid gap-3">
 <label className="text-sm font-medium">Avatar</label>
 <div className="flex items-center gap-4">
 <div className="h-20 w-20 overflow-hidden rounded-full border bg-gray-100">
 {avatarPreview ? (
 <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
 ) : form.avatarUrl ? (
 <Image
 src={form.avatarUrl}
 alt="Avatar"
 width={80}
 height={80}
 className="h-20 w-20 object-cover"
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
 No photo
 </div>
 )}
 </div>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
 />
 {avatarPreview && (
 <button
 type="button"
 className="text-sm text-gray-600 underline"
 onClick={() => onAvatarChange(null)}
 >
 Remove
 </button>
 )}
 </div>
 </div>

 {/* Display name */}
 <div className="grid gap-1">
 <label className="text-sm font-medium">Display name *</label>
 <input
 className="rounded border px-3 py-2"
 value={form.displayName}
 onChange={(e) => setField("displayName", e.target.value)}
 placeholder="e.g. Anna Beauty"
 />
 </div>

 {/* City */}
 <div className="grid gap-1">
 <label className="text-sm font-medium">City *</label>
 {CityAutocomplete ? (
 <CityAutocomplete
 value={form.city}
 onChange={(v: string) => setField("city", v)}
 placeholder="Start typing your city"
 />
 ) : (
 <input
 className="flex-1 rounded border px-3 py-2"
 value={form.city}
 onChange={(e) => setField("city", e.target.value)}
 placeholder="City"
 />
 )}
 </div>

 {/* Services */}
 <ChipEditor
 label="Services *"
 value={form.services}
 onAdd={(v) => addChip("services", v)}
 onRemove={(v) => removeChip("services", v)}
 placeholder="Add a service and press Enter"
 />

 {/* Languages */}
 <ChipEditor
 label="Languages *"
 value={form.languages}
 onAdd={(v) => addChip("languages", v)}
 onRemove={(v) => removeChip("languages", v)}
 placeholder="Add a language and press Enter"
 />

 <div className="flex items-center justify-end gap-3">
 <a
 href="/dashboard/master/profile"
 className="rounded border px-4 py-2 text-sm"
 >
 Cancel
 </a>
 <button
 type="submit"
 disabled={saving}
 className="rounded bg-pink-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
 >
 {saving ? "Saving…" : "Save changes"}
 </button>
 </div>
 </form>
 )}
 </div>
 );
}
