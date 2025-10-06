"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, collection } from "firebase/firestore";
import { requireDb, requireAuth } from "@/lib/firebase";
import { createListing } from "@/lib/firestore-listings";
import { useToast } from "@/components/ui/Toast";
import { toDisplayText } from "@/lib/safeText";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import type { TagOption } from "@/types/tags";
import ListingPhotos from "@/components/ListingPhotos";
import { MapContainer } from '@/components/mapComponents';


interface PhotoData {
  url: string;
  path: string;
  w: number;
  h: number;
}

export default function NewListingPage() {
 const router = useRouter();
  const { showToast } = useToast();
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = "Title is required";
    if (!city) newErrors.city = "City is required";
    if (services.length === 0) newErrors.services = "At least one service is required";
    if (languages.length === 0) newErrors.languages = "At least one language is required";
    
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
 const auth = requireAuth();
 const user = auth.currentUser;
    if (!user) {
      showToast("Please sign in", "error");
      return;
    }
    
    if (!validateForm()) return;

 try {
 setSaving(true);
      
       // Derive keys and names like in profile
       const serviceKeys = services.map(s => s.key);
       const serviceNames = services.map(s => s.name);
       const languageKeys = languages.map(l => l.key);
       const languageNames = languages.map(l => l.name);
       
       // Prepare form data with string mirrors
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
      const docRef = await createListing(user, formData);
      console.info("[BR][NewListing] Saved successfully:", docRef.id);
      
      showToast(`Listing created successfully: ${toDisplayText(title)} in ${toDisplayText(formData.cityName)}`, "success");
 router.push("/dashboard/master/listings");
 } catch (err) {
 console.error(err);
      showToast("Failed to save listing", "error");
 } finally {
 setSaving(false);
 }
 };

 return (
 <MapContainer>
 <div className="min-h-screen bg-gray-50">
 <div className="max-w-3xl mx-auto px-4 py-8">
 <div className="mb-8">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
 <p className="mt-1 text-sm text-gray-600">Add a new service listing to showcase your work</p>
 </div>
 <button
 onClick={() => router.back()}
 className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
 >
 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
 </svg>
 Back
 </button>
 </div>
 </div>
 <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
 <form className="space-y-6" onSubmit={onSubmit}>
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
          />
 </div>

        <div className="sticky-save md:relative md:sticky-0 md:bg-transparent md:border-0 md:p-0 md:m-0">
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full px-6 py-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            {saving ? "Creating..." : "Create Listing"}
          </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 </MapContainer>
 );
}