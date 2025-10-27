"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import type { CityNorm } from "@/lib/city";
import { normalizePlace } from "@/lib/city";
import { Loader } from "@googlemaps/js-api-loader";

declare const google: any;

type Props = {
  value?: CityNorm | null;
  onChange: (v: CityNorm | null) => void; // fires ONLY when a prediction is picked
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  disabled?: boolean;
};

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "Select city",
  className = "",
  allowClear = true,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [selected, setSelected] = React.useState<CityNorm | null>(
    value ?? null
  );
  const [raw, setRaw] = React.useState<string>(value?.formatted ?? "");
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    if (!value) return;
    setSelected(value);
    setRaw(value?.formatted || "");
  }, [value?.slug]);

  const initAutocomplete = useCallback(async () => {
    if (acRef.current || !inputRef.current) return;

    try {
      // Load Google Maps API using the same approach as working components
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!key) {
        console.error("[BR] Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
        return;
      }

      console.log(
        "[BR] CityAutocomplete: Initializing with key:",
        key.slice(0, 6) + "..."
      );

      // Check if already loaded
      if (window.google?.maps?.places?.Autocomplete) {
        console.log(
          "[BR] CityAutocomplete: Google Maps already loaded, initializing widget"
        );
        initializeAutocomplete();
        return;
      }

      console.log("[BR] CityAutocomplete: Loading Google Maps API...");
      // Load the API
      const loader = new Loader({
        apiKey: key,
        version: "weekly",
        libraries: ["places"],
        language: "en",
      });

      await loader.load();
      console.log(
        "[BR] CityAutocomplete: Google Maps API loaded, initializing widget"
      );
      initializeAutocomplete();
    } catch (e) {
      console.error("[BR] Autocomplete init error", e);
    }
  }, [onChange]);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
      console.log(
        "[BR] CityAutocomplete: Cannot initialize - missing input ref or Google Maps API"
      );
      return;
    }

    try {
      console.log("[BR] CityAutocomplete: Creating Autocomplete widget");
      const Google = (window as any).google as typeof google;

      const ac = new Google.maps.places.Autocomplete(inputRef.current!, {
        types: ["(cities)"],
        fields: ["place_id", "address_components", "geometry.location", "name"],
      });

      ac.addListener("place_changed", () => {
        console.log("[BR] CityAutocomplete: Place changed event fired");
        const place = ac.getPlace();
        const norm = normalizePlace(place);
        if (!norm) return;
        setSelected(norm);
        setRaw(norm.formatted);
        onChange(norm);
      });

      acRef.current = ac;
      setReady(true);
      console.log("[BR] CityAutocomplete: Widget created successfully");
    } catch (e) {
      console.error("[BR] Autocomplete widget creation error", e);
    }
  }, [onChange]);

  useEffect(() => {
    // try init on mount
    initAutocomplete();
    return () => {
      if (acRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(
          acRef.current
        );
        acRef.current = null;
      }
    };
  }, [initAutocomplete]);

  const handleFocus = async () => {
    if (!acRef.current) await initAutocomplete();
  };

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setRaw(e.target.value);
    if (selected) setSelected(null);
    // IMPORTANT: do NOT call onChange here → only allow chosen prediction
  }
  function handleBlur() {
    if (!selected) setRaw("");
    else setRaw(selected.formatted);
  }
  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        value={raw}
        onChange={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring focus:ring-pink-200"
      />
      {allowClear && selected && !disabled && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => {
            setSelected(null);
            setRaw("");
            onChange(null);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
