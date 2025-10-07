"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { requireDb, requireAuth } from "@/lib/firebase/client";
import { updateListing } from "@/lib/firestore-listings";
import { toDisplayText } from "@/lib/safeText";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import type { TagOption } from "@/types/tags";
import ListingPhotos from "@/components/ListingPhotos";
import { normalizeListing } from "@/lib/listings-normalize";
import { MapContainer } from '@/components/mapComponents';


interface PhotoData {
  url: string;
  path: string;
  w: number;
  h: number;
}

export default function EditListingPage() {
 const router = useRouter();
 const params = useParams() as { id: string };
 const id = params.id;

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

 const [title, setTitle] = useState("");
  const [city, setCity] = useState<CityNorm | null>(null);
 const [services, setServices] = useState<TagOption[]>([]);
 const [languages, setLanguages] = useState<TagOption[]>([]);
 const [priceMin, setPriceMin] = useState<string>("");
 const [priceMax, setPriceMax] = useState<string>("");
 const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoData[]>([]);

 useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) throw new Error('Missing listing id');
        const listingRef = doc(requireDb(), "listings", id);
        const listingSnap = await getDoc(listingRef);
        
        if (!listingSnap.exists()) {
          console.warn('[EditListing] not found', id);
          if (alive) {
            // Render empty form instead of crashing
            const safe = normalizeListing({});
            setTitle(safe.title);
            setCity(safe.city);
            setServices(safe.services);
            setLanguages(safe.languages);
            setPriceMin(safe.minPrice ? String(safe.minPrice) : "");
            setPriceMax(safe.maxPrice ? String(safe.maxPrice) : "");
            setDescription(safe.description);
            setPhotos(safe.photos.map(p => ({ url: p.url, path: p.path, w: 0, h: 0 })));
            setLoading(false);
          }
          return;
        }
        
        const raw = { id: listingSnap.id, ...listingSnap.data() };
        const safe = normalizeListing(raw);
        
        if (alive) {
          // Convert services/languages to TagOption format if needed
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

          setTitle(safe.title);
          setCity(safe.city);
          setServices(convertToTagOptions(safe.services));
          setLanguages(convertToTagOptions(safe.languages));
          setPriceMin(safe.minPrice ? String(safe.minPrice) : "");
          setPriceMax(safe.maxPrice ? String(safe.maxPrice) : "");
          setDescription(safe.description);
          setPhotos(safe.photos.map(p => ({ url: p.url, path: p.path, w: 0, h: 0 })));
          setLoading(false);
        }
      } catch (error: any) {
        console.error('[EditListing] load error:', error?.message);
        if (alive) {
          // Render empty form instead of crashing
          const safe = normalizeListing({});
          // Convert services/languages to TagOption format if needed
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

          setTitle(safe.title);
          setCity(safe.city);
          setServices(convertToTagOptions(safe.services));
          setLanguages(convertToTagOptions(safe.languages));
          setPriceMin(safe.minPrice ? String(safe.minPrice) : "");
          setPriceMax(safe.maxPrice ? String(safe.maxPrice) : "");
          setDescription(safe.description);
          setPhotos(safe.photos.map(p => ({ url: p.url, path: p.path, w: 0, h: 0 })));
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [id, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if ((title?.trim?.().length ?? 0) < 2) newErrors.title = "Title is required";
    if (!city || (city?.formatted?.trim?.().length ?? 0) === 0) newErrors.city = "City is required";
    if ((Array.isArray(services) ? services.length : 0) === 0) newErrors.services = "At least one service is required";
    if ((Array.isArray(languages) ? languages.length : 0) === 0) newErrors.languages = "At least one language is required";
    
    const minPrice = parseFloat(priceMin);
    const maxPrice = parseFloat(priceMax);
    if (priceMin && (isNaN(minPrice) || minPrice < 0)) {
      newErrors.priceMin = "Please enter a valid minimum price";
    }
    if (priceMax && (isNaN(maxPrice) || maxPrice < 0)) {
      newErrors.priceMax = "Please enter a valid maximum price";
    }
    if (priceMin && priceMax && minPrice > maxPrice) {
      newErrors.priceMax = "Maximum price must be greater than minimum price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const onSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
    
    if (!validateForm()) return;

 try {
 setSaving(true);
      
       // Derive keys and names like in profile
       const serviceKeys = services.map(s => s.key);
       const serviceNames = services.map(s => s.name);
       const languageKeys = languages.map(l => l.key);
       const languageNames = languages.map(l => l.name);
       
  const formData = {
  title,
  city: city, // full normalized object
  services: services,
  languages: languages,
  priceMin: priceMin ? parseFloat(priceMin) : null,
  priceMax: priceMax ? parseFloat(priceMax) : null,
  description,
  photos: photos.map(p => ({ url: p.url, path: p.path || '', width: null, height: null })),
  // Add string mirrors for safe rendering
  cityKey: city?.slug || '', // slug for Firestore queries
  cityName: city?.formatted || '', // easy string for UI
  serviceKeys: serviceKeys,
  serviceNames: serviceNames,
  languageKeys: languageKeys,
  languageNames: languageNames,
  };

      // Save using standardized helper
      const auth = requireAuth();
 if (!auth.currentUser) throw new Error('User not authenticated');
 await updateListing(auth.currentUser, id, formData);
      console.info("[BR][EditListing] Updated successfully:", id);
      
      alert(`Listing updated successfully: ${toDisplayText(title)} in ${toDisplayText(formData.cityName)}`);
      // Stay on the same page as requested
 } catch (err) {
 console.error(err);
      alert("Failed to update listing");
 } finally {
 setSaving(false);
 }
 };

  if (loading) return (
    <MapContainer>
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading…</div>
      </div>
    </div>
    </MapContainer>
  );

 return (
 <MapContainer>
 <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Edit Listing</h1>
      <form className="space-y-6 mobile-form" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Listing Title *</label>
          <input 
            className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
              errors.title ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
            }`}
            placeholder="Enter your listing title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder="Start typing your city"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services *</label>
          <MultiSelectAutocompleteV2
            label="Services"
            options={SERVICE_OPTIONS}
            value={services}
            onChange={(vals: TagOption[]) => {
              setServices(vals);
            }}
            placeholder="Search services..."
          />
          {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages *</label>
          <MultiSelectAutocompleteV2
            label="Languages"
            options={LANGUAGE_OPTIONS}
            value={languages}
            onChange={(vals: TagOption[]) => {
              setLanguages(vals);
            }}
            placeholder="Search languages..."
          />
          {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price ($)</label>
            <input 
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.priceMin ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
              }`}
              type="number"
              placeholder="0" 
              value={priceMin} 
              onChange={e => setPriceMin(e.target.value)} 
            />
            {errors.priceMin && <p className="text-red-500 text-sm mt-1">{errors.priceMin}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Price ($)</label>
            <input 
              className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                errors.priceMax ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
              }`}
              type="number"
              placeholder="1000" 
              value={priceMax} 
              onChange={e => setPriceMax(e.target.value)} 
            />
            {errors.priceMax && <p className="text-red-500 text-sm mt-1">{errors.priceMax}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea 
            className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 bg-white hover:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
            placeholder="Describe your services, experience, and what makes you special..."
            rows={4}
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 10)</label>
          <ListingPhotos
            photos={photos}
            onChange={setPhotos}
            maxPhotos={10}
            userId={requireAuth().currentUser?.uid || ""}
            listingId={id}
          />
        </div>

        <div className="sticky-save md:relative md:sticky-0 md:bg-transparent md:border-0 md:p-0 md:m-0">
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => router.push("/dashboard/master/listings")}
              className="flex-1 px-6 py-4 border-2 border-pink-200 text-pink-600 rounded-lg font-medium hover:border-pink-300 hover:bg-pink-50 transition-colors touch-target"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-1 px-6 py-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
 </div>
 </form>
 </div>
 </MapContainer>
 );
}