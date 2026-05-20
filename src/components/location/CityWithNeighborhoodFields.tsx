"use client";

import React from "react";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";
import { isTorontoCity } from "@/lib/neighborhood/toronto";
import type { LocationSelection } from "@/lib/neighborhood/locationSelection";
import NeighborhoodSelect from "./NeighborhoodSelect";

export type { LocationSelection };

type Props = {
  city: CityNorm | null;
  neighborhoodKey?: string | null;
  neighborhoodName?: string | null;
  onChange: (value: LocationSelection) => void;
  cityLabel?: string;
  cityPlaceholder?: string;
  /** filter: neighborhood empty = all results; form: empty = none saved */
  neighborhoodMode?: "filter" | "form";
  disabled?: boolean;
  className?: string;
};

/**
 * Reusable location pattern: Google city-only autocomplete + optional Toronto neighborhood.
 * City object / cityKey / cityName are never modified by neighborhood selection.
 */
export default function CityWithNeighborhoodFields({
  city,
  neighborhoodKey = null,
  neighborhoodName = null,
  onChange,
  cityLabel = "City",
  cityPlaceholder = "Select city",
  neighborhoodMode = "form",
  disabled = false,
  className = "",
}: Props) {
  const showNeighborhood = isTorontoCity(city);

  const handleCityChange = (nextCity: CityNorm | null) => {
    if (!isTorontoCity(nextCity)) {
      onChange({
        city: nextCity,
        neighborhoodKey: null,
        neighborhoodName: null,
      });
      return;
    }
    onChange({
      city: nextCity,
      neighborhoodKey,
      neighborhoodName,
    });
  };

  return (
    <div className={`space-y-0 ${className}`}>
      <div>
        {cityLabel ? (
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {cityLabel}
          </label>
        ) : null}
        <CityAutocomplete
          value={city}
          onChange={handleCityChange}
          placeholder={cityPlaceholder}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-500">
          {showNeighborhood
            ? "City selected. Choose a Toronto neighborhood below — not in the city field."
            : "Pick a city from the suggestions (e.g. Toronto, ON, Canada)."}
        </p>
      </div>

      {showNeighborhood ? (
        <NeighborhoodSelect
          className="mt-3"
          mode={neighborhoodMode}
          disabled={disabled}
          value={neighborhoodKey}
          onChange={(key, name) => {
            onChange({
              city,
              neighborhoodKey: key,
              neighborhoodName: name,
            });
          }}
        />
      ) : null}
    </div>
  );
}
