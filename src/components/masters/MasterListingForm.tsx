'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { upload, removeByUrl } from '@/lib/services/storage';
import { create, update } from '@/lib/services/firestoreMasters';
import type { Master, GeoPoint } from '@/types';
import { SERVICES } from '@/data/services';
import CityAutocomplete from '../CityAutocomplete';
import Portal from '../ui/Portal';
import { useToast } from '../ui/Toast';

// Predefined languages list
const LANGUAGES = [
  "English",
  "French", 
  "Russian",
  "Ukrainian",
  "Polish",
  "Portuguese",
  "Spanish",
  "Italian",
  "German",
  "Mandarin Chinese",
  "Cantonese",
  "Punjabi",
  "Hindi",
  "Tagalog (Filipino)",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Arabic",
  "Persian (Farsi)",
  "Turkish"
];

interface MasterListingFormProps {
  mode: 'create' | 'edit';
  uid: string;
  listingId?: string;
  initialData?: Master;
}

interface FormData {
  title: string;
  about: string;
  city: string;
  location: GeoPoint | null;
  services: string[];
  languages: string[];
  priceFrom: number | '';
  priceTo: number | '';
  photos: string[];
  status: 'active' | 'hidden';
}

export default function MasterListingForm({ mode, uid, listingId, initialData }: MasterListingFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    about: '',
    city: '',
    location: null,
    services: [],
    languages: [],
    priceFrom: '',
    priceTo: '',
    photos: [],
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serviceInput, setServiceInput] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [filteredServices, setFilteredServices] = useState<string[]>([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const serviceInputRef = useRef<HTMLInputElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        about: initialData.about || '',
        city: initialData.city || '',
        location: initialData.location || null,
        services: initialData.services || [],
        languages: initialData.languages || [],
        priceFrom: initialData.priceFrom || '',
        priceTo: initialData.priceTo || '',
        photos: initialData.photos || [],
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  // Filter services based on input
  useEffect(() => {
    if (!serviceInput.trim()) {
      setFilteredServices(SERVICES.slice(0, 12));
    } else {
      const filtered = SERVICES.filter(service =>
        service.toLowerCase().includes(serviceInput.toLowerCase())
      );
      setFilteredServices(filtered.slice(0, 12));
    }
  }, [serviceInput]);

  // Handle service selection
  const handleServiceSelect = (service: string) => {
    if (!formData.services.includes(service)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, service]
      }));
    }
    setServiceInput('');
    setShowServiceSuggestions(false);
  };

  // Handle service removal
  const handleServiceRemove = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service !== serviceToRemove)
    }));
  };

  // Handle language selection
  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  // Handle city selection
  const handleCitySelect = (city: string, lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      city,
      location: { lat, lng }
    }));
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const filename = `${Date.now()}-${file.name}`;
        const path = `masters/${uid}/${listingId || 'new'}/${filename}`;
        return await upload(file, path);
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...urls]
      }));
          } catch (error) {
        console.error('Error uploading photos:', error);
        showToast('Failed to upload photos. Please try again.', 'error');
      } finally {
      setUploadingPhotos(false);
    }
  };

  // Handle photo removal
  const handlePhotoRemove = async (photoUrl: string) => {
    try {
      await removeByUrl(photoUrl);
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo !== photoUrl)
      }));
    } catch (error) {
      console.error('Error removing photo:', error);
      // Remove from form even if storage removal fails
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo !== photoUrl)
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.city.trim() && !formData.location) {
      newErrors.city = 'City or location is required';
    }

    if (formData.services.length === 0) {
      newErrors.services = 'At least one service is required';
    }

    if (formData.priceFrom && formData.priceTo && Number(formData.priceFrom) > Number(formData.priceTo)) {
      newErrors.priceTo = 'Maximum price must be greater than minimum price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = {
        title: formData.title.trim(),
        about: formData.about.trim(),
        city: formData.city.trim(),
        location: formData.location,
        services: formData.services,
        languages: formData.languages,
        priceFrom: formData.priceFrom ? Number(formData.priceFrom) : undefined,
        priceTo: formData.priceTo ? Number(formData.priceTo) : undefined,
        photos: formData.photos,
        status: formData.status
      };

      if (mode === 'create') {
        await create(uid, data);
        showToast('Listing created successfully!', 'success');
      } else if (listingId) {
        await update(listingId, data);
        showToast('Listing updated successfully!', 'success');
      }

      router.push('/dashboard/master/listings');
    } catch (error) {
      console.error('Error saving listing:', error);
      showToast('Failed to save listing. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Listing Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="e.g., Professional Nail Artist in Downtown"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* About */}
      <div>
        <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
          About Your Services
        </label>
        <textarea
          id="about"
          rows={4}
          value={formData.about}
          onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Describe your services, experience, and what makes you unique..."
          maxLength={2000}
        />
        <p className="mt-1 text-sm text-gray-500">{formData.about.length}/2000 characters</p>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City/Location *
        </label>
        <CityAutocomplete
          value={formData.city}
          onSelect={handleCitySelect}
          placeholder="Enter your city"
          className={errors.city ? 'border-red-300' : ''}
        />
        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services *
        </label>
        <div className="relative">
          <input
            ref={serviceInputRef}
            type="text"
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            onFocus={() => setShowServiceSuggestions(true)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              errors.services ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Search and add services..."
          />
          
          {showServiceSuggestions && filteredServices.length > 0 && serviceInputRef.current && (
            <Portal>
              <div
                className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                style={{
                  top: serviceInputRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                  left: serviceInputRef.current.getBoundingClientRect().left + window.scrollX,
                  width: serviceInputRef.current.getBoundingClientRect().width,
                }}
              >
                <ul>
                  {filteredServices.map((service, index) => (
                    <li
                      key={index}
                      onClick={() => handleServiceSelect(service)}
                      className="px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </Portal>
          )}
        </div>
        
        {formData.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.services.map((service, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {service}
                <button
                  type="button"
                  onClick={() => handleServiceRemove(service)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.services && <p className="mt-1 text-sm text-red-600">{errors.services}</p>}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages You Speak
        </label>
        <div className="relative" ref={languageDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {formData.languages.length > 0 
              ? `${formData.languages.length} language(s) selected`
              : 'Select languages'
            }
          </button>
          
          {showLanguageDropdown && languageDropdownRef.current && (
            <Portal>
              <div
                className="fixed z-[9999] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                style={{
                  top: languageDropdownRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                  left: languageDropdownRef.current.getBoundingClientRect().left + window.scrollX,
                  width: languageDropdownRef.current.getBoundingClientRect().width,
                }}
              >
                <div className="p-2">
                  {LANGUAGES.map((language) => (
                    <label key={language} className="flex items-center px-2 py-1 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="mr-2"
                      />
                      <span className="text-sm">{language}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Portal>
          )}
        </div>
        
        {formData.languages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.languages.map((language) => (
              <span
                key={language}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {language}
                <button
                  type="button"
                  onClick={() => handleLanguageToggle(language)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priceFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Price ($)
          </label>
          <input
            type="number"
            id="priceFrom"
            value={formData.priceFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, priceFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="priceTo" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Price ($)
          </label>
          <input
            type="number"
            id="priceTo"
            value={formData.priceTo}
            onChange={(e) => setFormData(prev => ({ ...prev, priceTo: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 ${
              errors.priceTo ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
          />
          {errors.priceTo && <p className="mt-1 text-sm text-red-600">{errors.priceTo}</p>}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos
        </label>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {uploadingPhotos ? 'Uploading...' : 'Add Photos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
            <p className="text-sm text-gray-500">Upload photos of your work</p>
          </div>
          
          {formData.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(photo)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="active"
              checked={formData.status === 'active'}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'hidden' }))}
              className="mr-2"
            />
            <span className="text-sm">Active - Visible to clients</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hidden"
              checked={formData.status === 'hidden'}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'hidden' }))}
              className="mr-2"
            />
            <span className="text-sm">Hidden - Not visible to clients</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.push('/dashboard/master/listings')}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Listing' : 'Update Listing'}
        </button>
      </div>
    </form>
  );
}
