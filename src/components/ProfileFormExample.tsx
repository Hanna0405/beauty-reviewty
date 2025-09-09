'use client';

import { useState } from 'react';
import { useSaveProfile } from '@/lib/hooks/useSaveProfile';

/**
 * Minimal example showing how to use the useSaveProfile hook
 * This demonstrates the basic pattern for saving profiles
 */
export default function ProfileFormExample() {
  const { saveProfile, isSaving } = useSaveProfile();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    services: [] as string[],
    languages: [] as string[],
    about: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Call the hook's saveProfile function
      const savedProfile = await saveProfile(formData, avatarFile || undefined);
      console.log('Profile saved successfully:', savedProfile);
      
      // Handle success (e.g., show toast, redirect, etc.)
      alert('Profile saved successfully!');
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Handle error (e.g., show error toast)
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">City</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">About</label>
        <textarea
          value={formData.about}
          onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Profile Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full"
        />
      </div>

      {/* Submit Button - Shows loading state */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
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
  );
}
