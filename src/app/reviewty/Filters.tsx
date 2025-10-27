"use client";

import { useEffect, useState } from "react";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureKeyObject } from "@/lib/filters/normalize";
import type { CityNorm } from "@/lib/city";
import type { TagOption } from "@/types/tags";

export type ReviewtyFilters = {
  city: CityNorm | null;
  services: TagOption[];
  languages: TagOption[];
  ratingGte?: number | null;
  personQuery?: string;
};

export default function Filters({
  value,
  onChange,
  onReset,
}: {
  value: ReviewtyFilters;
  onChange: (next: ReviewtyFilters) => void;
  onReset: () => void;
}) {
  const [local, setLocal] = useState<ReviewtyFilters>(value);

  useEffect(() => setLocal(value), [value]);

  // propagate up (debounced a bit to avoid chatty re-renders)
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 120);
    return () => clearTimeout(t);
  }, [local, onChange]);

  return (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      {/* City - using same CityAutocomplete as Masters page */}
      <div className="w-full sm:w-64">
        <CityAutocomplete
          value={local.city}
          onChange={(city: CityNorm | null) =>
            setLocal((s) => ({ ...s, city }))
          }
          placeholder="Select city"
        />
      </div>

      {/* Services (multi) */}
      <div className="w-full sm:w-80">
        <MultiSelectAutocompleteV2
          label=""
          options={SERVICE_OPTIONS}
          value={local.services}
          onChange={(vals) => {
            const normalized = vals
              .map((v) => ensureKeyObject<TagOption>(v))
              .filter(Boolean) as TagOption[];
            setLocal((s) => ({ ...s, services: normalized }));
          }}
          placeholder="Service (e.g., hair-braids)"
        />
      </div>

      {/* Languages (multi) */}
      <div className="w-full sm:w-72">
        <MultiSelectAutocompleteV2
          label=""
          options={LANGUAGE_OPTIONS}
          value={local.languages}
          onChange={(vals) => {
            const normalized = vals
              .map((v) => ensureKeyObject<TagOption>(v))
              .filter(Boolean) as TagOption[];
            setLocal((s) => ({ ...s, languages: normalized }));
          }}
          placeholder="Languages"
        />
      </div>

      {/* Rating (kept as our existing control if present) */}
      <div className="w-28">
        <select
          className="w-full rounded border px-3 py-2"
          value={String(local.ratingGte ?? "")}
          onChange={(e) =>
            setLocal((s) => ({
              ...s,
              ratingGte: e.target.value ? Number(e.target.value) : null,
            }))
          }
        >
          <option value="">Rating</option>
          <option value="5">5★</option>
          <option value="4">4★+</option>
          <option value="3">3★+</option>
        </select>
      </div>

      {/* Person Query */}
      <div className="w-full sm:w-64">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Name / nickname / phone"
          value={local.personQuery || ""}
          onChange={(e) =>
            setLocal((s) => ({
              ...s,
              personQuery: e.target.value || undefined,
            }))
          }
        />
      </div>

      <button
        type="button"
        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}
