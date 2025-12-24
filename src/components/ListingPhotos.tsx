"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getImageDimensions } from "@/lib/storage-helpers";
import { uploadImageViaApi } from "@/lib/upload-client";
import { useToast } from "@/components/ui/Toast";
import { logStorageDebug } from "@/lib/debug-storage";

interface PhotoData {
  url: string;
  path: string;
  w: number;
  h: number;
}

interface ListingPhotosProps {
  photos: PhotoData[];
  onChange: (photos: PhotoData[]) => void;
  maxPhotos?: number;
  userId: string;
  listingId?: string; // For existing listings
}

/**
 * Photo upload component for listings with immediate Firebase Storage upload
 * Supports up to 10 photos with progress tracking and dimension detection
 */
export default function ListingPhotos({
  photos = [],
  onChange,
  maxPhotos = 10,
  userId,
  listingId,
}: ListingPhotosProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debug storage bucket on mount
  useEffect(() => {
    logStorageDebug();
    console.info(
      "[BR][ListingPhotos] Component mounted, photos:",
      photos.length
    );
  }, []);

  // Upload single file using CLIENT SDK (not server API)
  const uploadSingleFile = useCallback(
    async (file: File, fileId: string): Promise<PhotoData> => {
      try {
        // Use proper folder structure for listings
        const folder = listingId
          ? `listings/${listingId}/photos`
          : `listings/${userId}/uploads`;
        const url = await uploadImageViaApi(file, folder);

        // Safeguard: Reject signed URLs
        if (url.includes("GoogleAccessId=") || url.includes("X-Goog-")) {
          throw new Error("Invalid URL: signed URLs are not allowed");
        }

        // Extract storage path from URL for deletion later
        // URL format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=...
        // We'll use the URL itself as the path identifier
        const savedPath = url;

        // Compute dimensions
        const dims = await new Promise<{ w: number; h: number }>(
          (resolve, reject) => {
            const img = new Image();
            img.onload = () =>
              resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = reject;
            img.src = url;
          }
        );

        return { url, path: savedPath, w: dims.w, h: dims.h };
      } catch (error) {
        setUploadErrors((prev) => ({
          ...prev,
          [fileId]: error instanceof Error ? error.message : "Upload failed",
        }));
        throw error;
      }
    },
    [userId, listingId]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        // Check file type
        if (!file.type.startsWith("image/")) {
          setUploadErrors((prev) => ({
            ...prev,
            [file.name]: "Invalid file type",
          }));
          return false;
        }

        // Check file size (8MB limit)
        if (file.size > 8 * 1024 * 1024) {
          setUploadErrors((prev) => ({
            ...prev,
            [file.name]: "File too large (max 8MB)",
          }));
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // Debug logging for each file
      validFiles.forEach((file) => {
        console.info("[BR] will upload", file.name, file.type, file.size);
      });

      // Check if adding these files would exceed the limit
      const totalPhotos = photos.length + validFiles.length;
      if (totalPhotos > maxPhotos) {
        alert(
          `You can only upload up to ${maxPhotos} photos. Please remove some existing photos first.`
        );
        return;
      }

      setUploading(true);
      setUploadProgress({});
      setUploadErrors({});

      // Create abort controller for this upload batch
      abortControllerRef.current = new AbortController();

      try {
        // Upload files in parallel
        const uploadPromises = validFiles.map(async (file) => {
          const fileId = `${file.name}-${Date.now()}`;
          return uploadSingleFile(file, fileId);
        });

        const results = await Promise.allSettled(uploadPromises);

        // Process results
        const successfulUploads: PhotoData[] = [];
        const errors: string[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulUploads.push(result.value);
          } else {
            errors.push(
              `Failed to upload ${validFiles[index].name}: ${result.reason.message}`
            );
          }
        });

        // Update photos state with successful uploads
        if (successfulUploads.length > 0) {
          onChange([...photos, ...successfulUploads]);
        }

        // Show errors if any
        if (errors.length > 0) {
          showToast(`Upload errors: ${errors.join(", ")}`, "error");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showToast("Upload failed. Please try again.", "error");
      } finally {
        setUploading(false);
        setUploadProgress({});
        setUploadErrors({});
        abortControllerRef.current = null;
      }
    },
    [photos, maxPhotos, uploadSingleFile, onChange]
  );

  // Remove photo
  const removePhoto = useCallback(
    async (index: number) => {
      const photoToRemove = photos[index];
      const newPhotos = photos.filter((_, i) => i !== index);
      onChange(newPhotos);

      // Try to delete from storage via API (best effort)
      if (photoToRemove.path) {
        fetch(`/api/upload?path=${encodeURIComponent(photoToRemove.path)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    },
    [photos, onChange]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Add Photos"}
        </button>
        <span className="text-sm text-gray-600">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{fileId.split("-")[0]}</span>
                <span className="text-gray-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {uploadErrors[fileId] && (
                <p className="text-red-500 text-xs">{uploadErrors[fileId]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-pink-200"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label={`Remove photo ${index + 1}`}
              >
                ×
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {photo.w}×{photo.h}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Upload JPEG, PNG, or WebP images. Maximum 8MB per file.
      </p>
    </div>
  );
}
