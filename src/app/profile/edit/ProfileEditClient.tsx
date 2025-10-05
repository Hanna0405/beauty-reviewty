"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import type { TagOption } from "@/types/tags";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/saveProfile";
import { auth } from "@/lib/firebase/client";
import { getIdTokenOrThrow } from "@/lib/auth/getIdToken";

type ProfileForm = {
  displayName: string;
  city: CityNorm | null;
  cityName: string;
  cityKey: string;
  role: 'master' | 'client';
  services: TagOption[];
  serviceKeys: string[];
  serviceNames: string[];
  languages: TagOption[];
  languageKeys: string[];
  languageNames: string[];
  socials?: {
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
};


async function uploadAvatar(file: File) {
  const fd = new FormData();
  fd.append('files', file); // use plural
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  // Expect { files: [{url, path}] }
  return { url: data.files?.[0]?.url || '', path: data.files?.[0]?.path || '' };
}

export default function ProfileEditClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    city: null,
    cityName: "",
    cityKey: "",
    role: 'client',
    services: [],
    serviceKeys: [],
    serviceNames: [],
    languages: [],
    languageKeys: [],
    languageNames: [],
    socials: {
      instagram: "",
      tiktok: "",
      website: "",
    }
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [localAvatarFile, setLocalAvatarFile] = useState<File | null>(null);
  const [currentAvatarPath, setCurrentAvatarPath] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfileLoading(false);
      return;
    }

    // Load user profile from Firestore
    const loadProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        const profile = profileDoc.exists() ? profileDoc.data() : {};

        // Convert existing services/languages to TagOption format if needed
        const convertToTagOptions = (items: any[]): TagOption[] => {
          if (!Array.isArray(items)) return [];
          return items.map(item => {
            if (typeof item === 'string') {
              return { key: item, name: item };
            }
            if (item && typeof item === 'object' && item.key && item.name) {
              return item;
            }
            return { key: item || '', name: item || '' };
          });
        };

        setForm({
          displayName: profile.displayName || "",
          city: profile.city || null,
          cityName: profile.cityName || "",
          cityKey: profile.cityKey || "",
          role: profile.role || (profile.isMaster ? 'master' : 'client'),
          services: convertToTagOptions(profile.services || []),
          serviceKeys: profile.serviceKeys || [],
          serviceNames: profile.serviceNames || [],
          languages: convertToTagOptions(profile.languages || []),
          languageKeys: profile.languageKeys || [],
          languageNames: profile.languageNames || [],
          socials: {
            instagram: profile.socials?.instagram || "",
            tiktok: profile.socials?.tiktok || "",
            website: profile.socials?.website || "",
          }
        });

        if (profile.avatarUrl) {
          setAvatarPreview(profile.avatarUrl);
        }
        if (profile.avatarPath) {
          setCurrentAvatarPath(profile.avatarPath);
        }

        setProfileLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!db) return;

    setSaving(true);
    setError(null);

    try {
      let avatarUrl = avatarPreview;
      let avatarPath = currentAvatarPath;

      if (localAvatarFile) {
        const up = await uploadAvatar(localAvatarFile);
        avatarUrl = up.url;
        avatarPath = up.path;
      }

      // Prepare form data for API
      const formData = {
        ...form,
        photoURL: avatarUrl,
        avatarPath,
        links: {
          instagram: form.socials?.instagram ?? null,
          tiktok: form.socials?.tiktok ?? null,
          website: form.socials?.website ?? null,
        }
      };

      // 1) get a valid ID token
      const idToken = await getIdTokenOrThrow();

      // 2) prepare payload: keep your existing shape/serializer
      const payload = typeof formData === "object" ? formData : {};

      // 3) call API with Authorization header
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
        credentials: "include", // harmless for same-origin; keeps cookies if you set any
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("NOT_SIGNED_IN");
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "SAVE_FAILED");
      }

      // Also upsert to masters collection (keep existing logic)
      await setDoc(doc(db, 'masters', user.uid), {
        uid: user.uid,
        role: form.role,
        isMaster: form.role === 'master',
        displayName: form.displayName?.trim() || '',
        city: form.city ?? null,
        cityName: form.cityName || '',
        cityKey: form.cityKey || '',
        services: form.services,
        serviceKeys: form.serviceKeys,
        serviceNames: form.serviceNames,
        languages: form.languages,
        languageKeys: form.languageKeys,
        languageNames: form.languageNames,
        avatarUrl,
        avatarPath,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      router.push('/profile');
    } catch (e: any) {
      if (e?.message === "NOT_SIGNED_IN") {
        // gently redirect to login and preserve return path
        const ret = encodeURIComponent("/profile/edit");
        router.push(`/login?returnTo=${ret}`);
        return;
      }
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) return null;
  if (!user) return null; // optional if page is also wrapped by RequireAuth

  if (profileLoading) {
    return <div className="max-w-2xl mx-auto p-6"><div className="text-center text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Avatar</label>
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-pink-500 text-white flex items-center justify-center text-2xl font-semibold overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{form.displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              />
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
            placeholder="Your name"
            required
          />
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="text-sm font-medium">City</label>
          <CityAutocomplete
            value={form.city}
            onChange={(city: CityNorm | null) => {
              setForm(prev => ({
                ...prev,
                city: city,
                cityName: city ? city.formatted : '',
                cityKey: city ? city.slug : '',
              }));
            }}
            placeholder="Select your city"
          />
          {(!form.city || !form.cityKey) && (
            <p className="text-xs text-gray-500">Select a city from the dropdown (typing only selects predictions).</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm(f => ({ ...f, role: e.target.value as 'master' | 'client' }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
          >
            <option value="client">Client</option>
            <option value="master">Master</option>
          </select>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium mb-2">Services</label>
          <MultiSelectAutocompleteV2
            label="Services"
            options={SERVICE_OPTIONS}
            value={form.services}
            onChange={(vals: TagOption[]) => {
              setForm(p => ({
                ...p,
                services: vals,
                serviceKeys: vals.map(v => v.key),
                serviceNames: vals.map(v => v.name),
              }));
            }}
            placeholder="Search services..."
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium mb-2">Languages</label>
          <MultiSelectAutocompleteV2
            label="Languages"
            options={LANGUAGE_OPTIONS}
            value={form.languages}
            onChange={(vals: TagOption[]) => {
              setForm(p => ({
                ...p,
                languages: vals,
                languageKeys: vals.map(v => v.key),
                languageNames: vals.map(v => v.name),
              }));
            }}
            placeholder="Search languages..."
          />
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Links</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <input
              type="url"
              value={form.socials?.instagram || ""}
              onChange={(e) => setForm(f => ({ 
                ...f, 
                socials: { ...f.socials, instagram: e.target.value } 
              }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
              placeholder="https://instagram.com/username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">TikTok</label>
            <input
              type="url"
              value={form.socials?.tiktok || ""}
              onChange={(e) => setForm(f => ({ 
                ...f, 
                socials: { ...f.socials, tiktok: e.target.value } 
              }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
              placeholder="https://tiktok.com/@username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              value={form.socials?.website || ""}
              onChange={(e) => setForm(f => ({ 
                ...f, 
                socials: { ...f.socials, website: e.target.value } 
              }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-pink-600"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>


        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
