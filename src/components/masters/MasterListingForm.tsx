'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requireAuth, requireStorage, requireDb } from "@/lib/firebase/client";
import { uploadFilesAndGetURLs } from "@/lib/services/storage";

async function uploadImageViaApi(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.set('file', file);
  fd.set('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || !data?.ok || !data?.url) {
    throw new Error(data?.error || 'Upload failed');
  }
  return data.url as string;
}
import { createListingInBoth, patchListingPhotos } from "@/lib/firestore-listings";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";
import { stripUndefined, toNumberOrNull } from "@/lib/object-helpers";
import { useAuth } from '@/contexts/AuthContext';
import type { Listing, GeoPoint } from '@/types';
import { listingFormSchema, type ListingFormData } from '@/lib/schemas';
import CityAutocomplete from '@/components/CityAutocompleteSimple';
import ServiceAutocomplete from './ServiceAutocomplete';
import LanguagesField from '@/components/LanguagesField';
import { SERVICE_GROUPS } from '@/constants/services';
import { useToast } from '@/components/ui/Toast';

interface MasterListingFormProps {
  mode: 'create' | 'edit';
  uid: string;
  listingId?: string;
  initialData?: Listing;
}



export default function MasterListingForm({ mode, uid, listingId, initialData }: MasterListingFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: '',
      about: '',
      city: null,
      services: [],
      languages: [],
      priceFrom: undefined,
      status: 'active' as const,
      isPublished: false,
      priceTo: undefined,
      photos: []
    }
  });

  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to ensure user is authenticated
  function assertSignedIn() {
    const u = requireAuth().currentUser;
    if (!u) throw new Error("unauthenticated: please log in");
    return u;
  }

  // Dev test function to verify Firestore write permissions
  async function devTestWrite() {
    const u = requireAuth().currentUser;
    if (!u) { alert("Not signed in"); return; }
    try {
      await addDoc(collection(requireDb(), "listings"), {
        uid: u.uid,
        title: "DEV TEST",
        description: null,
        city: "Test City",
        services: ["Test"],
        languages: [],
        minPrice: null,
        maxPrice: null,
        photos: [],
        status: "hidden",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("DEV test write: OK (rules active)");
    } catch (e: any) {
      alert(`DEV test write failed: ${e.code}\n${e.message}`);
      console.error("[DEV test] failed:", e);
    }
  }

  // Debug function to verify Firebase project and auth
  function logFirebaseDebug() {
    try {
      const app = requireAuth().app;
      // @ts-ignore
      // Some SDKs expose options directly as app.options
      const options: any = (app as any).options || {};
      const projectId = options.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const u = requireAuth().currentUser;
      console.log("[DEBUG] projectId:", projectId, "uid:", u?.uid);
      alert(`Project: ${projectId}\nUID: ${u?.uid ?? "null"}`);
    } catch (e) {
      console.error("[DEBUG] getApp/options error", e);
    }
  }

  // Debug function to verify Firebase context (project, bucket, origin)
  function debugFirebaseContext() {
    try {
      const app = requireAuth().app;
      // @ts-ignore
      const opts: any = (app as any).options || {};
      const projectId = opts.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      // @ts-ignore
      const bucket = requireStorage().bucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const uid = requireAuth().currentUser?.uid || "null";
      alert(`Origin: ${window.location.origin}\nProject: ${projectId}\nBucket: ${bucket}\nUID: ${uid}`);
    } catch (e) {
      console.error("[DEBUG] error reading app/options:", e);
    }
  }

  // Debug function to check App Check state
  function debugAppCheck() {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const dbg = typeof window !== "undefined" ? (self.FIREBASE_APPCHECK_DEBUG_TOKEN ? "on" : "off") : "n/a";
    alert(`Origin: ${window.location.origin}\nSiteKey set: ${!!siteKey}\nDebug token: ${dbg}`);
  }

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        about: initialData.about || '',
        city: initialData.city ? {
          label: initialData.city,
          placeId: undefined,
          lat: initialData.location?.lat,
          lng: initialData.location?.lng,
        } : null,
        services: initialData.services || [],
        languages: initialData.languages || [],
        priceFrom: initialData.priceFrom || undefined,
        priceTo: initialData.priceTo || undefined,
        photos: initialData.photos || [],
        status: initialData.status || 'active',
        isPublished: initialData.isPublished ?? false
      });
    }
  }, [initialData, reset]);



  // Handle language selection
  const handleLanguageChange = (languages: string[]) => {
    setValue('languages', languages);
  };



  // Handle file upload
  const handleFileUpload = (fileList: FileList) => {
    setFiles(Array.from(fileList || []));
  };

  // Handle photo removal
  const handlePhotoRemove = async (photoUrl: string) => {
    const currentPhotos = watch('photos') || [];
    const newPhotos = currentPhotos.filter(photo => photo !== photoUrl);
    setValue('photos', newPhotos);
    
    // Note: Photo removal from storage is handled by the storage service
    // For now, we'll just remove from the form state
  };

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const u = requireAuth().currentUser;
    if (!u) { alert("Please log in."); return; }

    const formData = watch();
    const title = (formData.title || "").trim();
    const city = (formData.city?.label || "").trim();
    const services = formData.services || [];
    const languages = formData.languages || [];
    const description = (formData.about || "").trim();
    const minPrice = toNumberOrNull(formData.priceFrom);
    const maxPrice = toNumberOrNull(formData.priceTo);

    if (!title || !city || services.length === 0) { 
      alert("Please fill Title, City and at least one Service."); 
      return; 
    }

    let id: string | null = null;
    try {
      setSaving(true); 
      setProgress(0);

      // 1) Create listing doc (in both collections)
      const listingRef = doc(requireDb(), "listings", "");
      const docRef = await createListingInBoth(u, stripUndefined({
        title,
        description: description || '',
        city, 
        services, 
        languages,
 priceMin: minPrice, 
 priceMax: maxPrice,
        photos: [], 
        status: "active" as const
 }));
 id = docRef.id;

 // 2) Upload photos using new API
      let urls: string[] = [];
      if (files?.length) {
        const candid = files.filter(f => (f.size || 0) <= 8 * 1024 * 1024);
        urls = await Promise.all(
          candid.map(file => uploadImageViaApi(file, `listings/${id}`))
        );
      }

      // 3) Patch photos (if any)
      if (id && urls.length) {
        const updateRef = doc(requireDb(), "listings", id);
        await patchListingPhotos(u, id, urls.map(url => ({ url, path: '', width: null, height: null })));
      }

      alert(urls.length ? "Listing created with photos!" : "Listing created (no photos uploaded).");

      // 4) Navigate or reload so pages see it immediately
      router.push("/dashboard/master/listings");
      router.refresh();

    } catch (err: any) {
      console.error("[NewListing] submit error:", err);
      alert(`Save failed: ${err?.code ?? "unknown"}\n${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Listing Title *
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <input
                  {...field}
                  type="text"
                  id="title"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                    fieldState.error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Anna Petrenko — Brow Artist"
                />
                {fieldState.error && <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>}
              </>
            )}
          />
        </div>

        {/* About */}
        <div>
          <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
            About Your Services
          </label>
          <Controller
            name="about"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <textarea
                  {...field}
                  id="about"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Describe your services, experience, and what makes you unique..."
                  maxLength={2000}
                />
                <p className="mt-1 text-sm text-gray-500">{field.value?.length || 0}/2000 characters</p>
              </>
            )}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Location *
          </label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <CityAutocomplete
                value={field.value?.label || ''}
                onChange={(value) => field.onChange({ label: value, lat: undefined, lng: undefined })}
                placeholder="Enter city name"
              />
            )}
          />
        </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services *
        </label>
        <Controller
          name="services"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <div className="space-y-2">
                {/* Selected services as chips */}
                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newServices = field.value?.filter((_, i) => i !== index) || [];
                            setValue('services', newServices, { shouldDirty: true, shouldValidate: false });
                          }}
                          className="text-pink-600 hover:text-pink-800 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Service autocomplete */}
                <ServiceAutocomplete
                  value={field.value || []}
                  onChange={(newServices) => setValue('services', newServices, { shouldDirty: true, shouldValidate: false })}
                  groups={SERVICE_GROUPS}
                  placeholder="Type to search services..."
                />
                
                {fieldState.error && <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>}
              </div>
            </>
          )}
        />
      </div>

      {/* Languages */}
      <Controller
        name="languages"
        control={control}
        render={({ field }) => (
          <LanguagesField
            value={field.value || []}
            onChange={handleLanguageChange}
            label="Languages You Speak"
          />
        )}
      />

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priceFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Price ($)
          </label>
          <Controller
            name="priceFrom"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                id="priceFrom"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="0"
                min="0"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="priceTo" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Price ($)
          </label>
          <Controller
            name="priceTo"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                id="priceTo"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="0"
                min="0"
              />
            )}
          />
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              Add Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files || new FileList())}
              className="hidden"
            />
            <p className="text-sm text-gray-500">Upload photos of your work</p>
          </div>
          
          {/* Progress display */}
          {progress > 0 && progress < 100 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Uploading photos...</span>
                <span className="text-sm text-blue-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* File preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Selected files:</p>
              {files.map((file, index) => (
                <div key={index} className="text-sm text-gray-500">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ))}
            </div>
          )}
          
          <Controller
            name="photos"
            control={control}
            render={({ field }) => (
              field.value && field.value.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {field.value.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32">
                        <Image
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(photo)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : <div></div>
            )}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="active"
                  checked={field.value === 'active'}
                  onChange={(e) => field.onChange(e.target.value as 'active' | 'hidden')}
                  className="mr-2"
                />
                <span className="text-sm">Active - Visible to clients</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hidden"
                  checked={field.value === 'hidden'}
                  onChange={(e) => field.onChange(e.target.value as 'active' | 'hidden')}
                  className="mr-2"
                />
                <span className="text-sm">Hidden - Not visible to clients</span>
              </label>
            </div>
          )}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        {/* TEMP dev test buttons (remove after success) */}
        {process.env.NODE_ENV !== "production" && (
          <>
            <button
              type="button"
              onClick={devTestWrite}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              DEV: test Firestore write
            </button>
            <button
              type="button"
              onClick={logFirebaseDebug}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              DEV: show Firebase project
            </button>
                        <button
                          type="button"
                          onClick={debugFirebaseContext}
                          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                        >
                          DEV: Firebase context
                        </button>
                        <button
                          type="button"
                          onClick={debugAppCheck}
                          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                        >
                          DEV: AppCheck state
                        </button>
          </>
        )}
        <button
          type="button"
          onClick={() => router.push('/dashboard/master/listings')}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Listing"}
        </button>
                        </div>
       </form>
   );
 }
