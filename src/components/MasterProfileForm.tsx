"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from "@/components/auth/AuthProvider";
import { useSaveProfile } from "@/lib/hooks/useSaveProfile";
import { MasterProfileSchema, type MasterProfileFormData } from '@/lib/schemas';
import CityAutocomplete from "@/components/CityAutocomplete";
import ServiceAutocomplete from "@/components/ServiceAutocomplete";
import LanguagesField from "@/components/LanguagesField";
import { useToast } from "@/components/ui/Toast";

const SERVICE_OPTIONS = [
  "Nails", "Haircut", "Makeup", "Brows & Lashes", "Massage", "Facial", "Waxing", "Manicure", "Pedicure", "Hair Color", "Hair Styling", "Eyebrow Shaping", "Eyelash Extensions", "Skin Care", "Body Treatment"
];

type Props = {
  initialUser?: Partial<{
    name: string;
    city: {
      label: string;
      lat?: number;
      lng?: number;
    };
    about: string;
    services: string[];
    languages: string[];
    priceFrom: number;
    priceTo: number;
    photos: string[];
  }>;
};

export default function MasterProfileForm({ initialUser }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { saveProfile, isSaving } = useSaveProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialUser?.photos ?? []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<MasterProfileFormData>({
    resolver: zodResolver(MasterProfileSchema),
    defaultValues: {
      name: initialUser?.name ?? '',
      city: initialUser?.city ?? { label: '', lat: undefined, lng: undefined },
      services: initialUser?.services ?? [],
      languages: initialUser?.languages ?? [],
      priceFrom: initialUser?.priceFrom,
      priceTo: initialUser?.priceTo,
      about: initialUser?.about ?? ''
    }
  });

  const watchedServices = watch('services');

  // Initialize form with existing data
  useEffect(() => {
    if (initialUser) {
      reset({
        name: initialUser.name ?? '',
        city: initialUser.city ?? { label: '', lat: undefined, lng: undefined },
        services: initialUser.services ?? [],
        languages: initialUser.languages ?? [],
        priceFrom: initialUser.priceFrom,
        priceTo: initialUser.priceTo,
        about: initialUser.about ?? ''
      });
      setExistingPhotos(initialUser.photos ?? []);
    }
  }, [initialUser, reset]);

  // Handle file selection
  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    console.log(`${files.length} file(s) selected for upload`);
  }

  // Handle service addition
  const handleAddService = (service: string) => {
    if (service.trim() && !watchedServices?.includes(service.trim())) {
      const newServices = [...(watchedServices || []), service.trim()];
      setValue('services', newServices, { shouldDirty: true, shouldValidate: false });
    }
  };

  // Handle service removal
  const handleRemoveService = (index: number) => {
    const newServices = watchedServices?.filter((_, i) => i !== index) || [];
    setValue('services', newServices, { shouldDirty: true, shouldValidate: false });
  };

  // Handle form submission
  const onSubmit = async (data: MasterProfileFormData) => {
    if (!user) {
      showToast('Please sign in to save your profile', 'error');
      return;
    }

    try {
      console.log('[profile-form] Starting form submission...');

      // Get the first selected file as avatar (if any)
      const avatarFile = selectedFiles.length > 0 ? selectedFiles[0] : undefined;
      
      // Save profile using the hook
      const savedProfile = await saveProfile(data, avatarFile);
      
      console.log('[profile-form] Profile saved successfully:', savedProfile);

      // Update local state
      if (avatarFile && savedProfile.avatarUrl) {
        // If we uploaded a new avatar, update the existing photos
        setExistingPhotos(prev => [savedProfile.avatarUrl!, ...prev]);
      }
      setSelectedFiles([]);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      showToast('Profile saved successfully!', 'success');
    } catch (error: any) {
      console.error('[profile-form] Error saving profile:', error);
      const msg = error?.message || 'Failed to save profile';
      showToast(msg, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Name *</label>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <input
                  {...field}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400 ${
                    fieldState.error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Your name"
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* City */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">City *</label>
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <CityAutocomplete
                  value={field.value?.label || ""}
                  onChange={(val) => field.onChange({ label: val })}
                  placeholder="Enter your city..."
                  required
                  error={fieldState.error?.message}
                />
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
                {field.value?.lat != null && field.value?.lng != null && (
                  <p className="text-xs text-gray-500">
                    Coordinates: {field.value.lat.toFixed(5)}, {field.value.lng.toFixed(5)}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {/* Services */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Services *</label>
          <Controller
            name="services"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div className="space-y-2">
                  {/* Selected services as chips */}
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{service}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(index)}
                            className="text-pink-600 hover:text-pink-800 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Service autocomplete */}
                  <ServiceAutocomplete
                    value={watchedServices || []}
                    onChange={(newServices) => setValue('services', newServices)}
                    options={SERVICE_OPTIONS}
                    placeholder="Type to search services..."
                  />
                  
                  {fieldState.error && (
                    <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                  )}
                </div>
              </>
            )}
          />
        </div>

        {/* Languages */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Languages</label>
          <Controller
            name="languages"
            control={control}
            render={({ field }) => (
              <LanguagesField
                value={field.value || []}
                onChange={(languages) => field.onChange(languages)}
              />
            )}
          />
        </div>

        {/* Price Range */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Price Range (CAD)</label>
          <div className="flex gap-2">
            <Controller
              name="priceFrom"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="From"
                />
              )}
            />
            <Controller
              name="priceTo"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="To"
                />
              )}
            />
          </div>
        </div>

        {/* About */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">About</label>
          <Controller
            name="about"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <textarea
                  {...field}
                  rows={4}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400 ${
                    fieldState.error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Short description"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500">{field.value?.length || 0}/1000 characters</p>
                {fieldState.error && (
                  <p className="mt-1 text-sm text-red-600">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* Avatar Photo */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Profile Photo</label>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={onFilesSelected}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-400"
          />
          {selectedFiles.length > 0 && (
            <p className="text-xs text-gray-500">
              {selectedFiles.length} file(s) selected for upload
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-5 py-2.5 font-medium text-white disabled:opacity-50 hover:bg-pink-700 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    );
  }