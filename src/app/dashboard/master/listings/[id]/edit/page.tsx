"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { requireDb, requireAuth } from "@/lib/firebase/client";
import { updateListing } from "@/lib/firestore-listings";
import { useToast } from "@/components/ui/Toast";
import { CityAutocomplete, ServicesSelect, LanguagesSelect } from "@/components/selects";
import ListingPhotos from "@/components/ListingPhotos";

import { SERVICES_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/options";

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
  const { showToast } = useToast();

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

 const [title, setTitle] = useState("");
  const [city, setCity] = useState<any>(null);
 const [services, setServices] = useState<string[]>([]);
 const [languages, setLanguages] = useState<string[]>([]);
 const [priceMin, setPriceMin] = useState<string>("");
 const [priceMax, setPriceMax] = useState<string>("");
 const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoData[]>([]);

 useEffect(() => {
 (async () => {
      try {
        const listingRef = doc(requireDb(), "listings", id);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
          const data = listingSnap.data();
 setTitle(data.title || "");
          setCity(data.city ? { label: data.city, slug: data.citySlug || data.city } : null);
 setServices(data.services || []);
 setLanguages(data.languages || []);
 setPriceMin(data.priceMin != null ? String(data.priceMin) : "");
 setPriceMax(data.priceMax != null ? String(data.priceMax) : "");
 setDescription(data.description || "");
          
          // Convert existing photos to PhotoData format
          const existingPhotos: PhotoData[] = (data.photos || []).map((url: string) => ({
            url,
            path: url, // For existing photos, we don't have the storage path
            w: 0, // We don't have dimensions for existing photos
            h: 0,
          }));
          setPhotos(existingPhotos);
        } else {
          showToast("Listing not found", "error");
          router.push("/dashboard/master/listings");
        }
      } catch (error) {
        console.error("Failed to load listing:", error);
        showToast("Failed to load listing", "error");
      } finally {
 setLoading(false);
      }
 })();
  }, [id, showToast, router]);

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
    
    if (!validateForm()) return;

 try {
 setSaving(true);
      
      const listingRef = doc(requireDb(), "listings", id);
 const formData = {
 title,
 city: city?.slug ?? city?.label ?? "",
 services,
 languages,
 priceMin: priceMin ? parseFloat(priceMin) : null,
 priceMax: priceMax ? parseFloat(priceMax) : null,
 description,
 photos: photos.map(p => ({ url: p.url, path: p.path || '', width: null, height: null })),
 };

      // Save using standardized helper
      const auth = requireAuth();
 if (!auth.currentUser) throw new Error('User not authenticated');
 await updateListing(auth.currentUser, id, formData);
      console.info("[BR][EditListing] Updated successfully:", id);
      
      showToast("Listing updated successfully", "success");
      // Stay on the same page as requested
 } catch (err) {
 console.error(err);
      showToast("Failed to update listing", "error");
 } finally {
 setSaving(false);
 }
 };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading…</div>
      </div>
    </div>
  );

 return (
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
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <CityAutocomplete 
            value={city?.label || city || ""} 
            placeholder="City"
            autoOpenOnType={true}
            autoCloseOnSelect={true}
            onChange={(cityStr) => setCity(cityStr ? { label: cityStr, slug: cityStr } : null)}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services *</label>
          <ServicesSelect
            value={services}
            onChange={(vals: string[]) => setServices(vals ?? [])}
            options={SERVICES_OPTIONS}
            placeholder="Services (start typing...)"
            autoOpenOnType={true}
            autoCloseOnSelect={true}
          />
          {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages *</label>
          <LanguagesSelect
            value={languages}
            onChange={(vals: string[]) => setLanguages(vals ?? [])}
            options={LANGUAGE_OPTIONS}
            placeholder="Languages"
            autoOpenOnType={true}
            autoCloseOnSelect={true}
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
 );
}