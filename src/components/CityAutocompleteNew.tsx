"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};
export default function CityAutocompleteNew({ value, onChange, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null;
    let t: any;

    function init() {
      // Google script is loaded by GoogleMapsProvider. Just wait for it.
      if (typeof window === "undefined" || !window.google?.maps?.places) {
        t = setTimeout(init, 50);
        return;
      }
      if (!inputRef.current) return;
      ac = new google.maps.places.Autocomplete(inputRef.current!, {
        types: ["(cities)"],
        fields: ["formatted_address", "address_components", "geometry"],
        componentRestrictions: { country: ["ca"] },
      });
      ac.addListener("place_changed", () => {
        const p = ac!.getPlace();
        const label = p.formatted_address || inputRef.current!.value;
        onChange(label);
        // Ensure dropdown closes by blurring the input
        inputRef.current!.blur();
      });
    }

    init();
    return () => {
      if (t) clearTimeout(t);
      if (ac) google.maps.event.clearInstanceListeners(ac);
    };
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      defaultValue={value}
      placeholder={placeholder ?? "Start typing your city"}
      className="w-full rounded border px-3 py-2"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
