'use client';

import { useState } from 'react';
import CityAutocomplete from './CityAutocomplete';
import type { CityNorm } from '@/lib/city';

/**
 * Minimal profile form example using CityAutocomplete
 * Demonstrates proper usage with city and coordinates state management
 */
export default function ProfileFormWithCityAutocomplete() {
  const [city, setCity] = useState<CityNorm | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    about: '',
  });

  const handleCityChange = (selectedCity: CityNorm | null) => {
    setCity(selectedCity);
    
    console.log('City changed:', selectedCity);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData = {
      ...formData,
      city: city?.formatted,
      coords: city ? { lat: city.lat, lng: city.lng } : null,
      placeId: city?.placeId,
    };
    
    console.log('Profile data to save:', profileData);
    alert(`Profile data prepared:\n${JSON.stringify(profileData, null, 2)}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile Form with City Autocomplete</h2>
      
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

        {/* City with Autocomplete */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
            <CityAutocomplete
              value={city}
              onChange={handleCityChange}
              placeholder="Start typing a city name..."
              className="w-full"
            />
          
          {/* Display selected city info */}
          {city && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
              <p><strong>Selected:</strong> {city.formatted}</p>
              <p><strong>Coordinates:</strong> {city.lat.toFixed(6)}, {city.lng.toFixed(6)}</p>
              <p><strong>Place ID:</strong> {city.placeId}</p>
            </div>
          )}
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Save Profile
        </button>
      </form>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Debug Information:</h3>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify({ city }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
