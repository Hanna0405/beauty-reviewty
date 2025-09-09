"use client";
import React, { useEffect, useRef } from "react";

type Props = {
value: string;
onChange: (fullCity: string) => void; // e.g. "Barrie, ON, Canada"
placeholder?: string;
disabled?: boolean;
id?: string;
};

export default function CityAutocomplete({ value, onChange, placeholder = "Start typing a city…", disabled, id }: Props) {
const inputRef = useRef<HTMLInputElement | null>(null);
const elRef = useRef<any>(null);

useEffect(() => {
// Load Places library once
if (!("google" in window) && !document.getElementById("gmaps")) {
const s = document.createElement("script");
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
s.id = "gmaps";
s.async = true;
s.defer = true;
s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`;
document.head.appendChild(s);
s.onload = init;
} else {
init();
}

function init() {
if (!(window as any).google?.maps?.places) return;
// Use Place Autocomplete for cities (types: "(cities)")
const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
types: ["(cities)"],
fields: ["address_components", "name"],
});
elRef.current = autocomplete;
autocomplete.addListener("place_changed", () => {
const place = autocomplete.getPlace();
// Compose full city e.g., "Barrie, ON, Canada"
const comps = place.address_components || [];
const city = comps.find((c: any) => c.types.includes("locality"))?.long_name
|| comps.find((c: any) => c.types.includes("postal_town"))?.long_name
|| place.name || "";
const admin = comps.find((c: any) => c.types.includes("administrative_area_level_1"))?.short_name || "";
const country = comps.find((c: any) => c.types.includes("country"))?.long_name || "";
const full = [city, admin, country].filter(Boolean).join(", ");
onChange(full);
inputRef.current?.blur(); // close on mobile
});
}
}, [onChange]);

useEffect(() => {
if (inputRef.current && inputRef.current !== document.activeElement) {
inputRef.current.value = value || "";
}
}, [value]);

return (
<div className="mb-4">
<input
ref={inputRef}
id={id}
type="text"
defaultValue={value}
placeholder={placeholder}
disabled={disabled}
className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
/>
</div>
);
}
