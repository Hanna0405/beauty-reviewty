"use client";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ReviewPhoto } from "@/lib/reviews/types";
import { saveExistingMasterReview } from "@/lib/reviewty/saveExistingMasterReview";
import type { CommunityMaster } from "@/types/community";
import AutocompleteList from "@/components/AutocompleteList";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureKeyObject } from "@/lib/filters/normalize";
import type { CityNorm } from "@/lib/city";
import type { TagOption } from "@/types/tags";
import { cityToDisplay } from "@/lib/city/format";
import {
  loadActiveMasterSearchOptions,
  type MasterSearchOption,
} from "@/lib/reviewty/masterSearchOptions";
import { fireConfettiBurst } from "@/lib/ui/confetti";
import { prepareReviewPhotoFile } from "@/lib/images/prepareReviewPhoto";

function slugifyCityName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type PresetMaster = {
  id: string;
  displayName?: string;
  slug?: string;
  city?: string;
  services?: string[];
  contact?: any;
};

type Props = {
  open?: boolean;
  onClose?: () => void;
  presetMaster?: PresetMaster;
  initialMode?: "listing" | "community";
};

export default function ReviewtyCreateModal({
  open: controlledOpen,
  onClose,
  presetMaster,
  initialMode = "listing",
}: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { user } = useAuth();

  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen =
    controlledOpen !== undefined ? onClose || (() => {}) : setInternalOpen;

  // open/close via custom event (only if not controlled)
  useEffect(() => {
    if (controlledOpen === undefined) {
      const onOpen = () => setInternalOpen(true);
      window.addEventListener("reviewty:openCreate", onOpen);
      return () => window.removeEventListener("reviewty:openCreate", onOpen);
    }
  }, [controlledOpen]);

  const [mode, setMode] = useState<"listing" | "community">(initialMode);

  // Reset mode to initialMode when modal opens
  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  // Pre-fill form when preset master is provided
  useEffect(() => {
    if (presetMaster && open) {
      setMode("community");
      const cityStr = cityToDisplay(presetMaster.city);
      setCM({
        displayName: presetMaster.displayName || "",
        city: cityStr,
        services: presetMaster.services || [],
        contact: presetMaster.contact || {},
      });
      // Convert presetMaster.city to CityNorm if it's an object
      if (presetMaster.city && typeof presetMaster.city === "object") {
        setCity(presetMaster.city as CityNorm);
      } else {
        setCity(null);
      }
      setSelectedServices(
        (presetMaster.services || []).map((s) => {
          const label = SERVICE_OPTIONS.find((opt) => opt.value === s)?.label || s;
          return {
            key: s,
            label,
            name: label,
          };
        })
      );
    }
  }, [presetMaster, open]);

  // listing id selected
  const [listingId, setListingId] = useState("");
  const [listingQuery, setListingQuery] = useState("");
  const [listingOpts, setListingOpts] = useState<MasterSearchOption[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  // minimal community master
  const [cm, setCM] = useState<Partial<CommunityMaster>>({
    city: "",
    displayName: "",
    services: [],
  });

  // structured form state for community master
  const [city, setCity] = useState<CityNorm | null>(null);
  const [selectedServices, setSelectedServices] = useState<TagOption[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<TagOption[]>([]);

  // review form
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [photoWarning, setPhotoWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingListings(true);
      try {
        const masters = await loadActiveMasterSearchOptions(100);
        if (!cancelled) setListingOpts(masters);
      } catch (error) {
        console.warn("[ReviewtyCreateModal] Failed to load masters:", error);
        if (!cancelled) setListingOpts([]);
      } finally {
        if (!cancelled) setLoadingListings(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", "listing");
    fd.append("dir", "reviews");
    fd.append("listingId", "reviews");
    const res = await fetch("/api/upload-public", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[upload failed]", data);
      throw new Error(data.message || "Upload failed");
    }
    console.log("[upload success]", data.url);
    // Expect { files: [{url, path}] }
    return {
      url: data.files?.[0]?.url || data.url || "",
      path: data.files?.[0]?.path || data.path || "",
    };
  }

  // Helper to upload multiple photos with tolerance for individual failures
  async function uploadReviewPhotos(files: File[]): Promise<Array<{ url: string; path: string }>> {
    const uploadedPhotos: Array<{ url: string; path: string }> = [];

    for (const file of files) {
      try {
        const prepared = await prepareReviewPhotoFile(file);
        const result = await upload(prepared);
        uploadedPhotos.push(result);
        console.log("[upload success]", result.url);
      } catch (err: unknown) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[ReviewtyCreateModal] photo prepare/upload failed", err);
        }
        // Continue to next file - don't throw
      }
    }

    return uploadedPhotos;
  }

  // Helper function to remove undefined values recursively
  function sanitize<T extends Record<string, any>>(obj: T): T {
    // remove keys that are strictly undefined (but keep null, keep [])
    Object.keys(obj).forEach((key) => {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (
        obj[key] &&
        typeof obj[key] === "object" &&
        !Array.isArray(obj[key])
      ) {
        sanitize(obj[key]);
      }
    });
    return obj;
  }

  // Helper function to create a URL-safe slug
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  async function handleSubmitPublicCard() {
    // Auth guard: do not allow unauthenticated users to submit
    if (!user) {
      alert("Please sign up or log in to leave a review.");
      return;
    }

    try {
      // A. Collect form data into explicit local variables
      const masterName = cm.displayName?.trim() || "";
      const selectedCity = city;
      const services = selectedServices.map((s) => ({
        key: s.key || "",
        name: s.name || "",
        emoji: SERVICE_OPTIONS.find((opt) => opt.value === s.key)?.emoji || "",
      }));
      const languages = selectedLanguages.map((l) => ({
        key: l.key || "",
        name: l.name || "",
        emoji: LANGUAGE_OPTIONS.find((opt) => opt.value === l.key)?.emoji || "",
      }));
      const ratingValue = Number(rating) || 0;
      const textValue = text || "";
      const filesToUpload = files || [];

      // Validate required fields
      if (!masterName) {
        alert("Please enter a name/nickname/salon");
        return;
      }
      if (!selectedCity) {
        alert("Please select a city");
        return;
      }

      // B. Upload images with tolerance for individual failures
      setPhotoWarning(false); // Reset warning state
      const uploadedPhotos = await uploadReviewPhotos(filesToUpload);
      const uploadedPhotoURLs = uploadedPhotos.map((p) => p.url);
      
      // Show warning if some uploads failed
      if (uploadedPhotos.length < filesToUpload.length) {
        setPhotoWarning(true);
      }

      // C. Build the Firestore document in the exact "old / working" shape
      const now = serverTimestamp();

      // normalize services (can be strings OR objects {key,name,emoji})
      const normServices = Array.isArray(services) ? services : [];
      const serviceKeys = normServices
        .map((s: any) => {
          if (!s) return "";
          if (typeof s === "string") return s.toLowerCase();
          if (typeof s === "object")
            return (s.key || s.name || s.title || "").toLowerCase();
          return String(s).toLowerCase();
        })
        .filter(Boolean);

      const serviceNames = normServices
        .map((s: any) => {
          if (!s) return "";
          if (typeof s === "string") return s;
          if (typeof s === "object") return s.name || s.title || s.key || "";
          return String(s);
        })
        .filter(Boolean);

      // normalize languages the same way
      const normLanguages = Array.isArray(languages) ? languages : [];
      const languageKeys = normLanguages
        .map((l: any) => {
          if (!l) return "";
          if (typeof l === "string") return l.toLowerCase();
          if (typeof l === "object") return (l.key || l.name || "").toLowerCase();
          return String(l).toLowerCase();
        })
        .filter(Boolean);

      const languageNames = normLanguages
        .map((l: any) => {
          if (!l) return "";
          if (typeof l === "string") return l;
          if (typeof l === "object") return l.name || l.key || "";
          return String(l);
        })
        .filter(Boolean);

      const docData = {
        masterName: masterName || "",
        text: textValue || "",
        rating: typeof ratingValue === "number" ? ratingValue : 5,

        photos: Array.isArray(uploadedPhotoURLs) ? uploadedPhotoURLs : [],

        services: normServices,
        serviceKeys,
        serviceNames,

        languages: normLanguages,
        languageKeys,
        languageNames,

        city: selectedCity
          ? {
              city: selectedCity.city || "",
              cityKey: selectedCity.slug || "",
              cityName: selectedCity.formatted || "",
              country: selectedCity.country || "",
              countryCode: selectedCity.countryCode || "",
              formatted: selectedCity.formatted || "",
              lat: selectedCity.lat ?? null,
              lng: selectedCity.lng ?? null,
              placeId: selectedCity.placeId || "",
              state: selectedCity.state || "",
              stateCode: selectedCity.stateCode || "",
            }
          : null,

        // Add separate cityKey field for filtering
        cityKey: selectedCity?.slug || "",

        // Keep full city object as location
        location: selectedCity || null,

        createdAt: now,
        updatedAt: now,
        createdByUid: user?.uid || null,

        type: "public-card",
        status: "approved", // or 'pending' if we moderate before showing
      };

      console.log("[publicCard docData]", docData);

      // D. Write to Firestore in publicCards collection
      const colRef = collection(db, "publicCards");
      await addDoc(colRef, docData);

      void fireConfettiBurst().catch((err) => {
        console.warn("[Reviewty] Confetti failed:", err);
      });

      // Success: clear form and close modal
      setCM({ displayName: "", city: "", services: [] });
      setCity(null);
      setSelectedServices([]);
      setSelectedLanguages([]);
      setRating(5);
      setText("");
      setFiles([]);
      setPhotoWarning(false);

      alert("Thank you! Your review card has been submitted.");
      setOpen(false);
    } catch (err) {
      console.error("[Submit review] failed", err);
      // Only show this alert for real Firestore/submit errors, not individual upload errors
      alert("Sorry, something went wrong while saving your review.");
    }
  }

  async function handleSubmit() {
    // Auth guard: do not allow unauthenticated users to submit
    if (!user) {
      alert("Please sign up or log in to leave a review.");
      return;
    }

    try {
      // Upload photos (max 3) with tolerance for individual failures
      setPhotoWarning(false); // Reset warning state
      const filesToUpload = files.slice(0, 3);
      const uploadedPhotos = await uploadReviewPhotos(filesToUpload);
      
      // Show warning if some uploads failed
      if (uploadedPhotos.length < filesToUpload.length) {
        setPhotoWarning(true);
      }

      if (mode === "listing" && listingId) {
        const selectedMaster = listingOpts.find((o) => o.id === listingId) || null;
        
        if (!selectedMaster) {
          alert("Master not found");
          return;
        }
        
        console.log("[Reviewty] Existing master submit — selected", {
          id: selectedMaster.id,
          uid: selectedMaster.uid,
          profileId: selectedMaster.profileId,
          displayName: selectedMaster.title,
        });

        const reviewId = await saveExistingMasterReview({
          selectedMaster,
          rating: Number(rating) || 5,
          text: text || "",
          photos: uploadedPhotos,
          authorUid: user.uid,
          authorName: user.displayName || "Verified client",
        });

        console.log("[Reviewty] Existing master submit — success", {
          reviewId,
          masterId: selectedMaster.id,
          collection: "reviews",
        });

        void fireConfettiBurst().catch((err) => {
          console.warn("[Reviewty] Confetti failed:", err);
        });

        window.dispatchEvent(new CustomEvent("reviewty:reviewSubmitted"));
        alert("Thank you! Your review has been submitted.");
      } else {
        // Community mode: Create public card
        await handleSubmitPublicCard();
        return; // handleSubmitPublicCard already handles cleanup and closing
      }

      // Cleanup and close modal
      setOpen(false);
      setListingId("");
      setCM({});
      setFiles([]);
      setText("");
      setRating(5);
      setCity(null);
      setSelectedServices([]);
      setSelectedLanguages([]);
      setPhotoWarning(false);
    } catch (err) {
      console.error("[Submit review] failed", err);
      // Only show this alert for real Firestore/submit errors, not individual upload errors
      alert("Sorry, something went wrong while saving your review.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 space-y-4 md:w-[600px] max-md:w-[calc(100vw-2rem)] max-md:max-w-[calc(100vw-2rem)] max-md:overflow-y-auto max-md:box-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add review</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-3 text-sm">
          <button
            onClick={() => setMode("listing")}
            className={`rounded whitespace-nowrap px-3 py-2 text-sm md:px-6 md:py-3 md:text-base ${
              mode === "listing" ? "bg-pink-100 text-pink-700" : "bg-gray-100"
            }`}
          >
            Existing master
          </button>
          <button
            onClick={() => setMode("community")}
            className={`rounded whitespace-nowrap px-3 py-2 text-sm md:px-6 md:py-3 md:text-base ${
              mode === "community" ? "bg-pink-100 text-pink-700" : "bg-gray-100"
            }`}
          >
            Create public card
          </button>
        </div>

        {mode === "listing" ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Find master by name, city or service:
            </p>
            <AutocompleteList
              value={listingQuery}
              selectedId={listingId || null}
              onSelect={(opt) => {
                setListingId(opt.id);
                const cityLabel = opt.city || "—";
                const servicesLabel = (opt.services || [])
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(", ");
                setListingQuery(
                  servicesLabel
                    ? `${opt.title} — ${cityLabel} (${servicesLabel})`
                    : `${opt.title} — ${cityLabel}`
                );
              }}
              options={listingOpts}
              placeholder="e.g.: Anna Nails Toronto"
              maxVisible={3}
            />
            {!!listingId && (
              <div className="text-xs text-green-700">
                Selected: {listingQuery}
              </div>
            )}
            {loadingListings && (
              <div className="text-xs text-gray-500">Loading masters…</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Name / City row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="w-full rounded border px-3 py-2"
                placeholder="Name / nickname / salon"
                value={cm.displayName || ""}
                onChange={(e) =>
                  setCM((v: any) => ({ ...v, displayName: e.target.value }))
                }
              />

              <CityAutocomplete
                value={city}
                placeholder="City"
                onChange={(c: CityNorm | null) => setCity(c)}
              />
            </div>

            {/* Services */}
            <MultiSelectAutocompleteV2
              label=""
              options={SERVICE_OPTIONS}
              value={selectedServices}
              onChange={(vals) => {
                const normalized = vals
                  .map((v) => ensureKeyObject<TagOption>(v))
                  .filter(Boolean) as TagOption[];
                setSelectedServices(normalized);
              }}
              placeholder="Services (start typing...)"
            />

            {/* Languages */}
            <MultiSelectAutocompleteV2
              label=""
              options={LANGUAGE_OPTIONS}
              value={selectedLanguages}
              onChange={(vals) => {
                const normalized = vals
                  .map((v) => ensureKeyObject<TagOption>(v))
                  .filter(Boolean) as TagOption[];
                setSelectedLanguages(normalized);
              }}
              placeholder="Languages"
            />
          </div>
        )}

        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Your rating:</span>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value) as any)}
              className="rounded border p-1"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-yellow-400">{"★".repeat(rating)}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Describe your experience..."
            className="rounded border p-2 w-full resize-none max-md:w-full max-md:max-w-full box-border"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const arr = Array.from(e.target.files || []).slice(0, 3);
              setFiles(arr);
              setPhotoWarning(false); // Clear warning when files change
            }}
          />
          {photoWarning && (
            <p className="text-xs text-red-500">
              One of the photos failed to upload. Your review will be saved without that photo.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
