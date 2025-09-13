"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { logStorageDebug } from "@/lib/debug-storage";
import { uploadImageViaApi, deleteFromStorage } from "@/lib/upload-client";

interface AvatarUploaderProps {
  currentUrl?: string | null;
  currentPath?: string | null;
  onUpload: (url: string, path: string) => void;
  onChange?: (url: string, path: string) => void;
  userId: string;
  disabled?: boolean;
}

/**
 * Avatar upload component with immediate preview and storage management
 * Handles single file upload with compression and safe replacement
 */
export default function AvatarUploader({
  currentUrl,
  currentPath,
  onUpload,
  onChange,
  userId,
  disabled = false
}: AvatarUploaderProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug storage bucket on mount
  useEffect(() => {
    logStorageDebug();
    console.info("[BR][AvatarUploader] Component mounted, currentUrl:", !!currentUrl);
  }, []);

  // Compress image if needed
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 400x400)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Upload avatar
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Validate file
      if (!file) {
        throw new Error('Select an image (JPEG/PNG/WebP)');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Select an image (JPEG/PNG/WebP)');
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error('File size must be less than 8MB');
      }

      // Debug logging
      console.info("[BR] will upload", file.name, file.type, file.size);

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload using server-side API
      const url = await uploadImageViaApi(file, `masters/${userId}`);
      const savedPath = url; // For now, using URL as path
      
      // Delete old avatar if exists
      if (currentPath) {
        await deleteFromStorage(currentPath);
      }

      // Update parent component
      onUpload(url, savedPath);
      
      // Persist avatar URL and path to Firestore via server API
      try {
        await fetch('/api/profile/set-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId, url, path: savedPath })
        });
        // Call onChange after successful API call
        onChange?.(url, savedPath);
      } catch (e) {
        console.warn('Failed to persist avatar data to Firestore:', e);
        // Don't fail the upload if Firestore update fails
      }
      
      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      showToast(`Avatar upload failed: ${errorMessage}`, "error");
      
      // Clean up preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
    }
  }, [userId, currentPath, onUpload, previewUrl]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input value
    e.target.value = '';
  };

  // Remove avatar
  const handleRemove = useCallback(async () => {
    setUploading(true);
    setError(null);

    try {
      if (currentPath) {
        await deleteFromStorage(currentPath);
      }
      
      onUpload('', '');
      setPreviewUrl(null);

      // Clear avatar data in Firestore via server API
      try {
        await fetch('/api/profile/set-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: userId, url: null, path: null })
        });
        // Call onChange with null values after successful API call
        onChange?.('', '');
      } catch (e) {
        console.warn('Failed to clear avatar data in Firestore:', e);
        // Don't fail the remove if Firestore update fails
      }
    } catch (error) {
      console.error('Remove error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Remove failed';
      setError(errorMessage);
      showToast(`Avatar remove failed: ${errorMessage}`, "error");
    } finally {
      setUploading(false);
    }
  }, [currentPath, onUpload, userId]);

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Profile Photo
      </label>
      
      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-200 bg-gray-100">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Upload progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="text-white text-xs text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1"></div>
                Uploading...
              </div>
            </div>
          )}
        </div>

        {/* Upload controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || disabled}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
          
          {displayUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || disabled}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Upload a profile photo. JPEG, PNG, or WebP format. Maximum 8MB.
      </p>
    </div>
  );
}