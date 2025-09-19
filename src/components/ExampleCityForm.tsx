'use client';
import { useState } from 'react';
import CityAutocomplete from './CityAutocomplete';
import { NormalizedCity } from '@/lib/cityNormalize';
import { ensureSelectedCity } from '@/lib/ensureCity';

/**
 * Example form showing how to use the unified CityAutocomplete
 * with proper validation and error handling
 */
export default function ExampleCityForm() {
  const [city, setCity] = useState<NormalizedCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Ensure a city was selected from autocomplete (no free text)
      const selectedCity = ensureSelectedCity(city);
      
      // Example: Save to Firestore
      const profileData = {
        city: selectedCity,
        cityKey: selectedCity.slug,
        cityName: selectedCity.formatted,
        // ... other profile data
      };

      console.log('Saving profile with city:', profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Profile saved successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Example City Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* City Field */}
        <CityAutocomplete
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
          label="City"
          value={city}
          onChange={setCity}
          required
          region="CA"
        />

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Selected City Info */}
        {city && (
          <div className="p-3 bg-blue-50 rounded-md text-sm">
            <p><strong>Selected:</strong> {city.formatted}</p>
            <p><strong>Coordinates:</strong> {city.lat.toFixed(6)}, {city.lng.toFixed(6)}</p>
            <p><strong>Place ID:</strong> {city.placeId}</p>
            <p><strong>Slug:</strong> {city.slug}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
