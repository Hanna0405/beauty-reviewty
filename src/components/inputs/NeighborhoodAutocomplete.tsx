"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import type { NeighborhoodValue } from "@/lib/neighborhood/types";
import { neighborhoodSlug } from "@/lib/neighborhood/slug";
import { NEIGHBORHOOD_SUGGESTIONS } from "@/lib/neighborhood/suggestions";

type Props = {
  value: NeighborhoodValue | null;
  onChange: (value: NeighborhoodValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function commitInput(text: string): NeighborhoodValue | null {
  const name = text.trim();
  if (!name) return null;
  return { name, slug: neighborhoodSlug(name) };
}

export default function NeighborhoodAutocomplete({
  value,
  onChange,
  disabled = false,
  placeholder = "Yorkville",
}: Props) {
  const listId = useId();
  const [input, setInput] = useState(value?.name || "");

  useEffect(() => {
    setInput(value?.name || "");
  }, [value?.name]);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return NEIGHBORHOOD_SUGGESTIONS.slice(0, 8);
    return NEIGHBORHOOD_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [input]);

  const applyValue = (next: NeighborhoodValue | null) => {
    onChange(next);
    setInput(next?.name || "");
  };

  return (
    <div className="mt-3">
      <label
        htmlFor={`${listId}-input`}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        Neighborhood{" "}
        <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <div className="relative">
        <input
          id={`${listId}-input`}
          type="text"
          list={listId}
          disabled={disabled}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={() => applyValue(commitInput(input))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyValue(commitInput(input));
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 px-4 py-2.5 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 hover:border-pink-200 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:opacity-60"
          autoComplete="off"
        />
        <datalist id={listId}>
          {filtered.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Refine your area within the city — e.g. Yorkville, North York, Etobicoke
      </p>
    </div>
  );
}
