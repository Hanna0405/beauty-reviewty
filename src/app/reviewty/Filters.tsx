"use client";

import { useEffect, useState } from "react";
import { CityAutocomplete, ServicesSelect, LanguagesSelect } from "@/components/selects";
import { SERVICES_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/options";

type CityValue = string;

type ServiceOption = { value: string; label: string };
type LanguageOption = { value: string; label: string };

export type ReviewtyFilters = {
  city: CityValue | null;
  services: ServiceOption[];
  languages: LanguageOption[];
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
      {/* City */}
      <div className="w-full sm:w-64">
        <CityAutocomplete
          value={local.city || ""}
          onChange={(city: string) => setLocal((s) => ({ ...s, city: city || null }))}
          placeholder="City"
          autoOpenOnType={true}
          autoCloseOnSelect={true}
        />
      </div>

      {/* Services (multi) */}
      <div className="w-full sm:w-80">
        <ServicesSelect
          value={local.services.map(s => s.value)}
          onChange={(services: string[]) => {
            const serviceOptions = services.map(value => ({
              value,
              label: SERVICES_OPTIONS.find(s => s.value === value)?.label || value
            }));
            setLocal((s) => ({ ...s, services: serviceOptions }));
          }}
          options={SERVICES_OPTIONS}
          placeholder="Service (e.g., hair-braids)"
          autoOpenOnType={true}
          autoCloseOnSelect={true}
        />
      </div>

      {/* Languages (multi) */}
      <div className="w-full sm:w-72">
        <LanguagesSelect
          value={local.languages.map(l => l.value)}
          onChange={(languages: string[]) => {
            const languageOptions = languages.map(value => ({
              value,
              label: LANGUAGE_OPTIONS.find(l => l.value === value)?.label || value
            }));
            setLocal((s) => ({ ...s, languages: languageOptions }));
          }}
          options={LANGUAGE_OPTIONS}
          placeholder="Languages"
          autoOpenOnType={true}
          autoCloseOnSelect={true}
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
