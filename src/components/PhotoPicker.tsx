"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { uploadImageViaApi } from "@/lib/upload-client";

type PhotoData = {
  url: string;
  path: string;
  w: number;
  h: number;
};

type Props = {
  max?: number;
  onPhotosChange: (photos: PhotoData[]) => void;
  currentPhotos?: PhotoData[];
};

export default function PhotoPicker({
  max = 10,
  onPhotosChange,
  currentPhotos = [],
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {}
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>(currentPhotos);

  useEffect(() => {
    onPhotosChange(photos);
  }, [photos, onPhotosChange]);

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files]
  );

  async function add(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const all = [...files, ...picked].slice(0, max);
    setFiles(all);
    e.target.value = "";

    // Upload immediately
    setUploading(true);
    try {
      const folder = `listings/${Date.now()}`;

      // Upload files and get URLs using CLIENT SDK
      const urls = await Promise.all(
        picked.map(async (file) => {
          const url = await uploadImageViaApi(file, folder);
          // Safeguard: Reject signed URLs
          if (url.includes("GoogleAccessId=") || url.includes("X-Goog-")) {
            throw new Error(
              `Invalid URL format for ${file.name}: signed URLs are not allowed`
            );
          }
          return url;
        })
      );

      // Get image dimensions and create photo data
      const newPhotos: PhotoData[] = await Promise.all(
        picked.map(async (file, index) => {
          const url = urls[index];
          const dimensions = await getImageDimensions(file);
          return {
            url,
            path: url, // Using URL as path identifier
            w: dimensions.width,
            h: dimensions.height,
          };
        })
      );

      setPhotos((prev) => [...prev, ...newPhotos].slice(0, max));
      setFiles([]); // Clear local files after upload
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeFile(name: string) {
    setFiles((fs) => fs.filter((f) => f.name !== name));
  }

  function getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-6 py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || photos.length >= max}
        >
          {uploading ? "Uploading..." : "Add Photos"}
        </button>
        <span className="text-sm text-gray-600">
          {photos.length}/{max} photos
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={add}
        disabled={uploading}
      />

      {/* Upload progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([index, progress]) => (
            <div key={index} className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Current photos */}
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
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Local file previews (while uploading) */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={preview.name} className="relative">
              <img
                src={preview.url}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  Uploading...
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(preview.name)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
