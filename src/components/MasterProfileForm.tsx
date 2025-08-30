"use client";

/// <reference types="@types/google.maps" />

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { uploadMultiple } from "@/lib/services/storage";
import { upsert, getByOwner } from "@/lib/services/firestoreMasters";
import CityAutocomplete from "@/components/CityAutocomplete";
import LanguagesField from "@/components/LanguagesField";

type Props = {
  initialUser?: Partial<{
    name: string;
    city: string;
    bio: string;
    services: string[];
    languages: string[];
    priceFrom: number;
    priceTo: number;
    photos: string[];
    lat: number;
    lng: number;
  }>;
};

export default function MasterProfileForm({ initialUser }: Props) {
  // ----- form state -----
  const [name, setName] = useState(initialUser?.name ?? "");
  const [bio, setBio] = useState(initialUser?.bio ?? "");
  const [services, setServices] = useState<string[]>(initialUser?.services ?? []);
  const [languages, setLanguages] = useState<string[]>(initialUser?.languages ?? []);
  const [priceFrom, setPriceFrom] = useState<string>(String(initialUser?.priceFrom ?? ""));
  const [priceTo, setPriceTo] = useState<string>(String(initialUser?.priceTo ?? ""));
  const [city, setCity] = useState(initialUser?.city ?? "");
  const [lat, setLat] = useState<number | null>(initialUser?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialUser?.lng ?? null);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialUser?.photos ?? []);

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return name.trim().length >= 2 && city.trim().length >= 2 && services.length > 0 && !saving;
  }, [name, city, services, saving]);

  // ----- handlers -----
  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setNewFiles(Array.from(e.target.files));
  }

  // Add service to the list
  function addService(service: string) {
    if (service.trim() && !services.includes(service.trim())) {
      setServices([...services, service.trim()]);
    }
  }

  // Remove service from the list
  function removeService(index: number) {
    setServices(services.filter((_, i) => i !== index));
  }

  // Geocode city to get coordinates
  async function geocodeCity(cityName: string) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setLat(location.lat);
        setLng(location.lng);
      }
    } catch (error) {
      console.error('Error geocoding city:', error);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in.");
      return;
    }
    const uid = user.uid;

    if (!canSave) return;

    try {
      setSaving(true);

      // Upload new photos and combine with existing ones
      let uploaded: string[] = [];
      if (newFiles.length) {
        uploaded = await uploadMultiple(newFiles, `masters/${uid}`);
      }

      const old = Array.isArray(existingPhotos) ? existingPhotos : [];
      const photos = [...old, ...uploaded];

      // Normalize prices
      const priceFromNumber = Number(priceFrom);
      const priceToNumber = Number(priceTo);
      const normalizedPriceFrom = Number.isFinite(priceFromNumber) ? priceFromNumber : undefined;
      const normalizedPriceTo = Number.isFinite(priceToNumber) ? priceToNumber : undefined;

      // Geocode city if coordinates are not set
      if (!lat || !lng) {
        await geocodeCity(city);
      }

      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        services: services.filter(s => s.trim()),
        languages: languages,
        priceFrom: normalizedPriceFrom,
        priceTo: normalizedPriceTo,
        city: city.trim(),
        location: lat && lng ? { lat, lng } : undefined,
        photos,
      };

      const result = await upsert(uid, payload);

      if (result) {
        setNewFiles([]);
        alert("Profile saved!");
      } else {
        alert("Saving failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Saving failed. See console.");
    } finally {
      setSaving(false);
    }
  }

  // ----- UI -----
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Name */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="Your name"
        />
      </div>

      {/* City w/ Google Places */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">City</label>
        <CityAutocomplete
          value={city}
          onChange={(newCity) => {
            setCity(newCity);
            // Clear coordinates when city changes
            setLat(null);
            setLng(null);
          }}
        />
        {lat != null && lng != null && (
          <p className="text-xs text-gray-500">Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
        )}
      </div>

      {/* Services */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Services</label>
        <div className="space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={service}
                onChange={(e) => {
                  const newServices = [...services];
                  newServices[index] = e.target.value;
                  setServices(newServices);
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="e.g. Lash extensions"
              />
              <button
                type="button"
                onClick={() => removeService(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addService("")}
            className="text-sm text-pink-600 hover:text-pink-700"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Languages */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Languages</label>
        <LanguagesField value={languages} onChange={setLanguages} />
      </div>

      {/* Price Range */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Price Range (CAD)</label>
        <div className="flex gap-2">
          <input
            inputMode="decimal"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="From"
          />
          <input
            inputMode="decimal"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="To"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">About</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="Short description"
        />
      </div>

      {/* Photos */}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Portfolio photos</label>
        <input type="file" multiple accept="image/*" onChange={onFilesSelected} />
        {!!existingPhotos.length && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {existingPhotos.map((url, i) => (
              <div key={i} className="relative h-24 w-full overflow-hidden rounded-md border">
                <Image src={url} alt={`photo-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
        {!!newFiles.length && (
          <p className="text-xs text-gray-500">{newFiles.length} new file(s) selected</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={!canSave || saving}
          className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}