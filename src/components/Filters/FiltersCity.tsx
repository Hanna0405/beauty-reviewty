"use client";
import React from "react";
import CityAutocomplete from "@/components/CityAutocomplete";
import type { CityNorm } from "@/lib/city";

interface FiltersCityProps {
  value: CityNorm | null;
  onChange: (value: CityNorm | null) => void;
  placeholder?: string;
}

export function FiltersCity({ value, onChange, placeholder = "Select city" }: FiltersCityProps) {
  try {
    return (
      <CityAutocomplete
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  } catch (error) {
    console.error("[FiltersCity] Error rendering city filter:", error);
    // Always render the component even on error - don't show "Oops!" message
    return (
      <CityAutocomplete
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  }
}

