"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CityAutocomplete from "@/components/CityAutocomplete";
import MultiSelectAutocompleteV2 from "@/components/inputs/MultiSelectAutocompleteV2";
import { SERVICE_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/catalog";
import { ensureKeyObject } from "@/lib/filters/normalize";
import type { CityNorm } from "@/lib/city";
import type { TagOption } from "@/types/tags";

export default function UnifiedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [city, setCity] = useState<CityNorm | null>(null);
  const [services, setServices] = useState<TagOption[]>([]);
  const [languages, setLanguages] = useState<TagOption[]>([]);

  // Read current values from URL on mount
  useEffect(() => {
    const urlCity = searchParams?.get("city");
    const urlServices = searchParams?.get("serviceKeys");
    const urlLanguages = searchParams?.get("languageKeys");

    if (urlCity) {
      // Convert city key to CityNorm object
      setCity({
        formatted: urlCity,
        slug: urlCity,
        placeId: "",
        city: "",
        state: "",
        stateCode: "",
        country: "",
        countryCode: "",
        lat: 0,
        lng: 0
      });
    }

    if (urlServices) {
      const serviceKeys = urlServices.split(",").filter(Boolean);
      const serviceOptions = serviceKeys.map(key => {
        const option = SERVICE_OPTIONS.find(s => s.value === key);
        return {
          key,
          name: option?.label || key,
          emoji: option?.emoji
        };
      });
      setServices(serviceOptions);
    }

    if (urlLanguages) {
      const languageKeys = urlLanguages.split(",").filter(Boolean);
      const languageOptions = languageKeys.map(key => {
        const option = LANGUAGE_OPTIONS.find(l => l.value === key);
        return {
          key,
          name: option?.label || key,
          emoji: option?.emoji
        };
      });
      setLanguages(languageOptions);
    }
  }, [searchParams]);

  const updateParams = (patch: Record<string, string | string[] | null | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(patch).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length) params.set(k, v.join(","));
        else params.delete(k);
      } else if (typeof v === "string" && v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    router.replace(`?${params.toString()}`);
  };

  const handleCityChange = (newCity: CityNorm | null) => {
    setCity(newCity);
    const cityKey = newCity?.slug || "";
    updateParams({
      city: cityKey || null,
    });
  };

  const handleServicesChange = (items: any[]) => {
    const normalized = items.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[];
    setServices(normalized);
    const keysArr = normalized.map((i: any) => i?.key).filter(Boolean);
    updateParams({ serviceKeys: keysArr });
  };

  const handleLanguagesChange = (items: any[]) => {
    const normalized = items.map(v => ensureKeyObject<TagOption>(v)).filter(Boolean) as TagOption[];
    setLanguages(normalized);
    const keysArr = normalized.map((i: any) => i?.key).filter(Boolean);
    updateParams({ languageKeys: keysArr });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <CityAutocomplete
          value={city}
          onChange={handleCityChange}
          placeholder="Select city"
          allowClear={true}
        />
      </div>

      <MultiSelectAutocompleteV2
        label="Services"
        options={SERVICE_OPTIONS}
        value={services}
        onChange={handleServicesChange}
        placeholder="Search services…"
      />

      <MultiSelectAutocompleteV2
        label="Languages"
        options={LANGUAGE_OPTIONS}
        value={languages}
        onChange={handleLanguagesChange}
        placeholder="Search languages…"
      />
    </div>
  );
}
