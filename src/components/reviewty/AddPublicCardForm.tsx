"use client"; // ensure client component

// PATCH: tighten form state, null-safety, and payload
import React, { useMemo, useState } from "react";

// add a tiny toast – use whatever you have (headless), here simple inline banner
function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-3 rounded-md bg-green-50 text-green-800 text-sm px-3 py-2 border border-green-200">
      {msg}
    </div>
  );
}
import CityAutocomplete from "@/components/common/CityAutocomplete";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { uploadFilesGetUrls } from "@/lib/client/upload";
import ButtonWithSpinner from "@/components/ui/ButtonWithSpinner";
import { createPublicReview } from "@/lib/createPublicReview";

// helper рядом с формой
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function withCityMirrors(city: any) {
  if (!city) return null;
  const formatted = city.formatted || city.cityName || city.city || "";
  const out = { ...city };
  out.slug = out.slug || slugify(formatted);
  out.cityName = out.cityName || formatted;
  out.cityKey = out.cityKey || out.slug;
  return out;
}

type CityObj = {
  city: string;
  state?: string | null;
  stateCode?: string | null;
  country: string;
  countryCode: string;
  formatted: string;
  lat: number;
  lng: number;
  placeId: string;
  slug: string;
  cityName: string;
  cityKey: string;
};

type TagOption = {
  key: string;
  name: string;
  emoji?: string;
};

export function AddPublicCardForm({
  currentUser,
  onSuccessRefresh,
}: {
  currentUser?: { uid: string } | null;
  onSuccessRefresh?: () => void;
}) {
  const [masterName, setMasterName] = useState("");
  const [city, setCity] = useState<CityObj | null>(null);
  const [services, setServices] = useState<TagOption[]>([]);
  const [languages, setLanguages] = useState<TagOption[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const serviceKeys = useMemo(() => services.map((s) => s.key), [services]);
  const serviceNames = useMemo(() => services.map((s) => s.name), [services]);
  const languageKeys = useMemo(() => languages.map((l) => l.key), [languages]);
  const languageNames = useMemo(
    () => languages.map((l) => l.name),
    [languages]
  );

  // PATCH: ослабляем готовность формы — не требуем placeId
  // было: const isReady = !!masterName.trim() && !!city?.placeId && rating >= 1 && rating <= 5 && !!text.trim();
  const isReady =
    !!masterName.trim() &&
    !!city?.formatted &&
    rating >= 1 &&
    rating <= 5 &&
    !!text.trim();

  // PATCH: сбрасываем стейт ТОЛЬКО при успехе, а при ошибке — не трогаем введённые значения
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (submitting) return; // prevent double-click

    if (!isReady) {
      setError("Please fill required fields (master, city, rating, review).");
      return;
    }

    setSubmitting(true);
    try {
      // PATCH: skip upload when not signed in, but allow submission
      let photoUrls: string[] = [];
      if (files && files.length) {
        if (currentUser?.uid) {
          photoUrls = await uploadFilesGetUrls(files, currentUser.uid);
        } else {
          console.warn("User not signed in — skip photo upload");
          setError(
            "You are not signed in. The review will be submitted without photos."
          );
        }
      }

      // Use the new createPublicReview action
      const safeCity = withCityMirrors(city!);
      const cityKey = safeCity?.cityKey || safeCity?.slug || null;

      await createPublicReview({
        publicId: `pc_${cityKey}_${slugify(masterName.trim())}`,
        masterId: "public-card", // placeholder since this is a public card
        rating,
        text: text.trim(),
        photos: photoUrls.map((url) => ({ url, path: url })),
        authorUid: currentUser?.uid || "anonymous",
        authorName: null,
      });

      // success: banner + reset (no manual refresh needed - streaming will handle it)
      setSuccessMsg("Your review has been submitted successfully!");
      setMasterName("");
      setCity(null);
      setServices([]);
      setLanguages([]);
      setRating(5);
      setText("");
      setFiles(null);
    } catch (err: any) {
      console.error("public-card submit exception", err);
      setError(err?.message || "Unexpected error");
      // НИЧЕГО НЕ СБРАСЫВАЕМ при ошибке
    } finally {
      setSubmitting(false);
    }
  }

  // Helper functions for multi-select
  const handleServiceSelect = (option: any) => {
    const newService: TagOption = {
      key: option.value,
      name: option.label,
      emoji: option.emoji,
    };
    if (!services.some((s) => s.key === newService.key)) {
      setServices([...services, newService]);
    }
  };

  const handleLanguageSelect = (option: any) => {
    const newLanguage: TagOption = {
      key: option.value,
      name: option.label,
      emoji: option.emoji,
    };
    if (!languages.some((l) => l.key === newLanguage.key)) {
      setLanguages([...languages, newLanguage]);
    }
  };

  const removeService = (key: string) => {
    setServices(services.filter((s) => s.key !== key));
  };

  const removeLanguage = (key: string) => {
    setLanguages(languages.filter((l) => l.key !== key));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMsg && <SuccessBanner msg={successMsg} />}

      {/* Master name */}
      <div>
        <label className="block text-sm font-medium mb-1">Master Name *</label>
        <input
          type="text"
          name="masterName"
          id="masterName"
          value={masterName}
          onChange={(e) => setMasterName(e.target.value)}
          placeholder="Name / nickname / phone number / salon"
          aria-describedby="masterNameHelp"
          className="w-full rounded border px-3 py-2 text-sm outline-none focus:ring focus:border-gray-400"
          disabled={submitting}
          required
        />
        <p id="masterNameHelp" className="mt-1 text-xs text-gray-500">
          You can enter a name, nickname, phone number, or salon.
        </p>
      </div>

      {/* City — unified pattern, no free text allowed */}
      <div>
        <label className="block text-sm font-medium mb-1">City *</label>
        <CityAutocomplete
          value={city?.formatted || ""}
          onSelect={(val) => setCity(val)} // val is normalized object from our pattern
          onClear={() => setCity(null)}
          required
          placeholder="Select a city from the list"
          disabled={submitting}
        />
        {city?.formatted ? (
          <p className="text-xs text-green-600 mt-1">
            Selected: {city.formatted}
          </p>
        ) : (
          <p className="text-xs text-amber-600 mt-1">
            Select a city from the list.
          </p>
        )}
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium mb-1">Services</label>
        <div className="space-y-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                const option = SERVICE_OPTIONS.find(
                  (opt) => opt.value === e.target.value
                );
                if (option) handleServiceSelect(option);
                e.target.value = "";
              }
            }}
            className="select select-bordered w-full"
          >
            <option value="">Select a service...</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
          {services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <span key={service.key} className="badge badge-primary gap-1">
                  {service.emoji} {service.name}
                  <button
                    type="button"
                    onClick={() => removeService(service.key)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium mb-1">Languages</label>
        <div className="space-y-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                const option = LANGUAGE_OPTIONS.find(
                  (opt) => opt.value === e.target.value
                );
                if (option) handleLanguageSelect(option);
                e.target.value = "";
              }
            }}
            className="select select-bordered w-full"
          >
            <option value="">Select a language...</option>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language.key}
                  className="badge badge-secondary gap-1"
                >
                  {language.emoji} {language.name}
                  <button
                    type="button"
                    onClick={() => removeLanguage(language.key)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Rating *
        </label>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Rating"
        >
          {[1, 2, 3, 4, 5].map((v) => {
            const active = v <= rating;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setRating(v)}
                aria-checked={active}
                role="radio"
                className="p-0.5"
                disabled={submitting}
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-5 w-5 ${
                    active ? "text-amber-500" : "text-gray-300"
                  } fill-current`}
                  aria-hidden="true"
                >
                  <path d="M10 15.27l-5.18 3.05 1.58-5.65L2 8.24l5.74-.5L10 2.5l2.26 5.24 5.74.5-4.4 4.43 1.58 5.65z" />
                </svg>
              </button>
            );
          })}
        </div>
        {/* keep your hidden/controlled input if you submit rating via form */}
        <input type="hidden" name="rating" value={rating} />
      </div>

      {/* Text */}
      <div>
        <label className="block text-sm font-medium mb-1">Review Text *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="textarea textarea-bordered w-full"
          placeholder="Your review..."
          rows={4}
          disabled={submitting}
          required
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Photos (optional)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(e.target.files)}
          className="file-input file-input-bordered w-full"
        />
        {files && files.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {files.length} file(s) selected
          </p>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <ButtonWithSpinner type="submit" loading={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit Review"}
      </ButtonWithSpinner>
    </form>
  );
}
