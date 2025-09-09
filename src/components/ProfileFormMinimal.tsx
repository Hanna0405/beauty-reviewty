'use client';

import { useState } from 'react';
import { useSaveProfile } from '@/lib/hooks/useSaveProfile';

/**
 * Minimal profile form example using the useSaveProfile hook
 * Demonstrates proper usage with loading states and error handling
 */
export default function ProfileFormMinimal() {
  const { saveProfile, isSaving } = useSaveProfile();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    services: [] as string[],
    languages: [] as string[],
    about: '',
    priceFrom: '',
    priceTo: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    try {
      // Call the hook's saveProfile function
      const savedProfile = await saveProfile(formData, avatarFile || undefined);
      console.log('Profile saved successfully:', savedProfile);
      
      // Handle success
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Clear form
      setFormData({
        name: '',
        city: '',
        services: [],
        languages: [],
        about: '',
        priceFrom: '',
        priceTo: '',
      });
      setAvatarFile(null);
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Handle error
      setMessage({ 
        type: 'error', 
        text: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const addService = (service: string) => {
    if (service.trim() && !formData.services.includes(service.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, service.trim()]
      }));
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = (language: string) => {
    if (language.trim() && !formData.languages.includes(language.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }));
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile Form</h2>
      
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter your name"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Enter your city"
          />
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Services
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a service"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    addService(target.value);
                    target.value = '';
                  }
                }}
              />
            </div>
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Languages
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a language"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    addLanguage(target.value);
                    target.value = '';
                  }
                }}
              />
            </div>
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            About
          </label>
          <textarea
            value={formData.about}
            onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.priceFrom}
              onChange={(e) => setFormData(prev => ({ ...prev, priceFrom: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From"
              min="0"
            />
            <input
              type="number"
              value={formData.priceTo}
              onChange={(e) => setFormData(prev => ({ ...prev, priceTo: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To"
              min="0"
            />
          </div>
        </div>

        {/* Profile Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {avatarFile && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {avatarFile.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isSaving ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </form>
    </div>
  );
}
