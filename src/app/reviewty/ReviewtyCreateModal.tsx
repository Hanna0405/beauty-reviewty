"use client";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createReviewViaApi } from "@/lib/reviews/createClient";
import type { ReviewPhoto } from "@/lib/reviews/types";
import type { CommunityMaster } from "@/types/community";
import AutocompleteList from "@/components/AutocompleteList";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureKeyObject } from "@/lib/filters/normalize";
import type { CityNorm } from "@/lib/city";
import type { TagOption } from "@/types/tags";
import { cityToDisplay } from "@/lib/city/format";

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
};

export default function ReviewtyCreateModal({
  open: controlledOpen,
  onClose,
  presetMaster,
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

  const [mode, setMode] = useState<"listing" | "community">("listing");

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
        (presetMaster.services || []).map((s) => ({
          key: s,
          label: SERVICE_OPTIONS.find((opt) => opt.value === s)?.label || s,
        }))
      );
    }
  }, [presetMaster, open]);

  // listing id selected
  const [listingId, setListingId] = useState("");
  const [listingQuery, setListingQuery] = useState("");
  const [listingOpts, setListingOpts] = useState<
    {
      id: string;
      title: string;
      city?: string;
      services?: string[];
      photoUrl?: string;
    }[]
  >([]);
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

  useEffect(() => {
    let off = false;
    async function load() {
      setLoadingListings(true);
      try {
        const q = query(
          collection(db, "listings"),
          orderBy("updatedAt", "desc"),
          limit(100)
        );
        const snap = await getDocs(q);
        if (off) return;
        const rows = snap.docs.map((d) => {
          const x: any = d.data();
          return {
            id: d.id,
            title: x.title || "Untitled",
            city: cityToDisplay(x.city),
            services: Array.isArray(x.services) ? x.services : [],
            photoUrl: x?.photos?.[0]?.url || "",
          };
        });
        setListingOpts(rows);
      } finally {
        if (!off) setLoadingListings(false);
      }
    }
    load();
    return () => {
      off = true;
    };
  }, []);

  async function upload(file: File) {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("scope", "listing");
    fd.append("listingId", "reviews");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
      url: data.files?.[0]?.url || "",
      path: data.files?.[0]?.path || "",
    };
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
    try {
      // A. Collect form data into explicit local variables
      const displayName = cm.displayName?.trim() || "";
      const selectedCity = city;
      const services = selectedServices.map((s) => ({
        key: s.key || "",
        name: s.label || "",
        emoji: SERVICE_OPTIONS.find((opt) => opt.value === s.key)?.emoji || "",
      }));
      const languages = selectedLanguages.map((l) => ({
        key: l.key || "",
        name: l.label || "",
        emoji: LANGUAGE_OPTIONS.find((opt) => opt.value === l.key)?.emoji || "",
      }));
      const ratingValue = Number(rating) || 0;
      const textValue = text || "";
      const filesToUpload = files || [];

      // Validate required fields
      if (!displayName) {
        alert("Please enter a name/nickname/salon");
        return;
      }
      if (!selectedCity) {
        alert("Please select a city");
        return;
      }

      // B. Upload images to Firebase Storage
      const photoUrls: string[] = [];
      for (const file of filesToUpload) {
        const path = `reviews/publicCard/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        photoUrls.push(url);
      }

      // C. Build the Firestore document object manually - NO undefined values
      const masterPublic: any = {
        displayName: displayName,
        services: Array.isArray(services) ? services : [],
        languages: Array.isArray(languages) ? languages : [],
      };

      // Attach city info if we have it
      if (selectedCity) {
        masterPublic.city = {
          city: selectedCity.city ?? null,
          state: selectedCity.state ?? null,
          stateCode: selectedCity.stateCode ?? null,
          country: selectedCity.country ?? null,
          countryCode: selectedCity.countryCode ?? null,
          formatted: selectedCity.formatted ?? null,
          lat: selectedCity.lat ?? null,
          lng: selectedCity.lng ?? null,
          placeId: selectedCity.placeId ?? null,
          slug: selectedCity.slug ?? null,
        };

        // mirrors used for filtering/search
        masterPublic.cityName = selectedCity.formatted ?? "";
        masterPublic.cityKey = selectedCity.slug ?? "";
      }

      const reviewDoc: any = {
        masterPublic,
        rating: ratingValue,
        text: textValue,
        photos: photoUrls || [],
        createdAt: serverTimestamp(),
        source: "public-card",
      };

      // Generate masterKey for URL routing (only if city exists)
      if (selectedCity) {
        const citySlug =
          selectedCity.slug || slugify(selectedCity.formatted || "");
        const masterKey = slugify(`${displayName}-${citySlug}`);
        reviewDoc.masterKey = masterKey;
      }

      // Add master info for filtering (only if city exists)
      if (selectedCity) {
        reviewDoc.masterDisplay = displayName;
        reviewDoc.masterCity = selectedCity.formatted ?? "";
        reviewDoc.masterServices = services
          .map((s) => s.key)
          .filter((key) => key);
        reviewDoc.masterLanguages = languages
          .map((l) => l.key)
          .filter((key) => key);

        // Build keywords array safely - no undefined values
        const keywords = [
          displayName.toLowerCase(),
          selectedCity.formatted?.toLowerCase() || "",
          ...services.map((s) => s.key.toLowerCase()).filter((key) => key),
          ...languages.map((l) => l.key.toLowerCase()).filter((key) => key),
        ].filter((keyword) => keyword && keyword.length > 0);
        reviewDoc.masterKeywords = keywords;
      }

      // IMPORTANT: remove any remaining `undefined` recursively
      sanitize(reviewDoc);

      console.log("[reviewDoc]", reviewDoc);

      // D. Write to Firestore
      const colRef = collection(db, "reviews");
      await addDoc(colRef, reviewDoc);

      // Success: clear form and close modal
      setCM({ displayName: "", city: "", services: [] });
      setCity(null);
      setSelectedServices([]);
      setSelectedLanguages([]);
      setRating(5);
      setText("");
      setFiles([]);

      alert("Thank you! Your review card has been submitted.");
      setOpen(false);
    } catch (err) {
      console.error("[Submit review] failed", err);
      alert("Sorry, something went wrong while saving your review.");
    }
  }

  async function handleSubmit() {
    if (!user) return alert("Log in first");

    try {
      // Upload photos (max 3)
      const uploadedPhotos: { url: string; path: string }[] = [];
      for (const f of files.slice(0, 3)) {
        const path = `reviews/listing/${Date.now()}_${f.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, f);
        const url = await getDownloadURL(fileRef);
        uploadedPhotos.push({ url, path });
      }

      if (mode === "listing" && listingId) {
        // Existing master: get master data and create review
        const snap = await getDoc(doc(db, "listings", listingId));
        if (!snap.exists()) return alert("Listing not found");
        const data = snap.data() as any;

        const docData = {
          // Master info (for filtering)
          masterId: listingId,
          masterDisplay: data.title || data.displayName || "Unknown master",
          masterCity: cityToDisplay(data.city) || "",
          masterServices: Array.isArray(data.services) ? data.services : [],
          masterLanguages: Array.isArray(data.languages) ? data.languages : [],
          masterKeywords: [
            data.title?.toLowerCase(),
            cityToDisplay(data.city)?.toLowerCase(),
            ...(Array.isArray(data.services)
              ? data.services.map((s: string) => s.toLowerCase())
              : []),
            ...(Array.isArray(data.languages)
              ? data.languages.map((l: string) => l.toLowerCase())
              : []),
          ].filter(Boolean),

          // Review content
          rating: Number(rating) || 0,
          text: text || "",
          photos: uploadedPhotos,

          // Master reference
          masterRef: { type: "listing", id: listingId },

          // Housekeeping
          createdAt: serverTimestamp(),
          source: "existing-master",
        };

        // Write to Firestore in "reviews" collection
        const colRef = collection(db, "reviews");
        await addDoc(colRef, docData);

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
    } catch (err) {
      console.error("[Submit review] failed", err);
      alert("Sorry, something went wrong while saving your review.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 space-y-4">
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
            className={`px-3 py-1.5 rounded ${
              mode === "listing" ? "bg-pink-100 text-pink-700" : "bg-gray-100"
            }`}
          >
            Existing master
          </button>
          <button
            onClick={() => setMode("community")}
            className={`px-3 py-1.5 rounded ${
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
              onSelect={(opt) => {
                setListingId(opt.id);
                setListingQuery(`${opt.title} — ${cityToDisplay(opt.city)}`);
              }}
              options={listingOpts}
              placeholder="e.g.: Anna Nails Toronto"
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
            className="rounded border p-2"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const arr = Array.from(e.target.files || []).slice(0, 3);
              setFiles(arr);
            }}
          />
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
