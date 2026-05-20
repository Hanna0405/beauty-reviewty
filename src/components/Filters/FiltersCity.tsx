"use client";

import React from "react";
import CityWithNeighborhoodFields from "@/components/location/CityWithNeighborhoodFields";
import type { LocationSelection } from "@/lib/neighborhood/locationSelection";
import type { CityNorm } from "@/lib/city";

interface FiltersCityProps {
  city: CityNorm | null;
  neighborhoodKey?: string | null;
  onChange: (value: LocationSelection) => void;
  placeholder?: string;
  cityLabel?: string;
}

/** City filter with optional Toronto neighborhood (cityKey first, then neighborhoodKey). */
export function FiltersCity({
  city,
  neighborhoodKey = null,
  onChange,
  placeholder = "Select city",
  cityLabel = "City",
}: FiltersCityProps) {
  return (
    <CityWithNeighborhoodFields
      city={city}
      neighborhoodKey={neighborhoodKey}
      neighborhoodMode="filter"
      cityLabel={cityLabel}
      cityPlaceholder={placeholder}
      onChange={onChange}
    />
  );
}
