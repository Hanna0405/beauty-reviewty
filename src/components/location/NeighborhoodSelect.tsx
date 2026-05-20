"use client";

import React, { useId } from "react";
import { TORONTO_NEIGHBORHOODS } from "@/lib/neighborhood/toronto";
import { neighborhoodSlug } from "@/lib/neighborhood/slug";

export type NeighborhoodSelectProps = {
  value: string | null;
  onChange: (neighborhoodKey: string | null, neighborhoodName: string | null) => void;
  disabled?: boolean;
  /** filter: empty option = all; form: empty option = none */
  mode?: "filter" | "form";
  className?: string;
};

export default function NeighborhoodSelect({
  value,
  onChange,
  disabled = false,
  mode = "form",
  className = "",
}: NeighborhoodSelectProps) {
  const id = useId();
  const emptyLabel = mode === "filter" ? "All neighborhoods" : "None";

  const selectedSlug = value ? neighborhoodSlug(value) : "";

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        Neighborhood{" "}
        <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <select
        id={id}
        disabled={disabled}
        value={selectedSlug}
        onChange={(e) => {
          const slug = e.target.value;
          if (!slug) {
            onChange(null, null);
            return;
          }
          const label =
            TORONTO_NEIGHBORHOODS.find((n) => neighborhoodSlug(n) === slug) ||
            slug;
          onChange(slug, label);
        }}
        className="w-full rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 px-4 py-2.5 text-sm text-gray-800 shadow-sm transition-colors hover:border-pink-200 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:opacity-60"
      >
        <option value="">{emptyLabel}</option>
        {TORONTO_NEIGHBORHOODS.map((name) => (
          <option key={name} value={neighborhoodSlug(name)}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

