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
import ProfileAvatar from "@/components/profile/ProfileAvatar";

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
  // ✅ avatar-related fields
  photoURL: string;
  avatarUrl: string;
  avatarPath: string;
  avatar: {
    url: string;
    path: string;
  };
  socials?: {
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
};


// Use the stable avatar uploader
async function uploadAvatar(file: File) {
  const { uploadAvatar: stableUploadAvatar } = await import('@/lib/profile/uploadAvatar');
  const url = await stableUploadAvatar(file);
  // Return in the expected format for compatibility
  return { url, path: `profiles/${auth.currentUser?.uid}/avatar.jpg` };
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
    // ✅ avatar-related defaults
    photoURL: "",
    avatarUrl: "",
    avatarPath: "",
    avatar: {
      url: "",
      path: "",
    },
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
          // ✅ avatar-related fields with proper fallbacks
          photoURL: profile.photoURL || profile.avatarUrl || profile.avatar?.url || "",
          avatarUrl: profile.avatarUrl || profile.photoURL || "",
          avatarPath: profile.avatarPath || profile.avatar?.path || "",
          avatar: {
            url: profile.avatar?.url || profile.avatarUrl || profile.photoURL || "",
            path: profile.avatar?.path || profile.avatarPath || "",
          },
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

      // Prepare form data for API - include all avatar fields
      const formData = {
        ...form,
        photoURL: form.photoURL || avatarUrl,
        avatarUrl: form.avatarUrl || avatarUrl,
        avatarPath: form.avatarPath || avatarPath,
        avatar: {
          url: form.avatar?.url || avatarUrl,
          path: form.avatar?.path || avatarPath,
        },
        links: {
          instagram: form.socials?.instagram ?? null,
          tiktok: form.socials?.tiktok ?? null,
          website: form.socials?.website ?? null,
        }
      };

      // auto-fill missing fields before saving
      if ((!formData.photoURL || formData.photoURL === '') && formData.avatar?.url) {
        formData.photoURL = formData.avatar.url;
      }
      if ((!formData.avatarUrl || formData.avatarUrl === '') && formData.avatar?.url) {
        formData.avatarUrl = formData.avatar.url;
      }
      if ((!formData.avatarPath || formData.avatarPath === '') && formData.avatar?.path) {
        formData.avatarPath = formData.avatar.path;
      }

      console.log('[Profile Submit Final] values:', formData);

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

      alert('Profile saved successfully');
      router.push('/profile');
    } catch (e: any) {
      if (e?.message === "NOT_SIGNED_IN") {
        // gently redirect to login and preserve return path
        const ret = encodeURIComponent("/profile/edit");
        router.push(`/login?returnTo=${ret}`);
        return;
      }
      console.error('Failed to save profile:', e);
      alert('Error saving profile');
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show immediate preview
    setLocalAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload immediately to get the URL
      const uploadResult = await uploadAvatar(file);
      const url = String(uploadResult.url);
      const path = String(uploadResult.path || `profiles/${user?.uid}/avatar.jpg`);

      // 1) Update form state for UI
      setForm(prev => ({
        ...prev,
        photoURL: url,
        avatarUrl: url,
        avatarPath: path,
        avatar: {
          url: url,
          path: path,
        },
      }));

      // Update preview with real URL
      setAvatarPreview(url);
      setCurrentAvatarPath(path);

      // 2) ✅ Optional instant persist (safe; ignore if fails)
      try {
        await saveProfile({
          photoURL: url,
          avatarUrl: url,
          avatarPath: path,
          avatar: { url, path },
        });
        console.log('[Avatar] persisted immediately');
      } catch (persistError) {
        console.error('[Avatar Upload] persist error:', persistError);
        // ignore, submit will persist
      }

      console.log('[Avatar Upload] ✅ form updated:', { url, path });
    } catch (error) {
      console.error('[Avatar Upload] failed:', error);
      setError('Failed to upload avatar');
      setAvatarPreview(null);
    }
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
            <ProfileAvatar 
              user={{
                ...user,
                avatarUrl: avatarPreview || form.avatarUrl,
                displayName: form.displayName
              }} 
              size={80} 
            />
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
