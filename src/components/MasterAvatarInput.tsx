'use client';

import { useState } from 'react';
import { uploadImage } from '@/lib/upload-image';
import { convertToUploadableImage } from '@/lib/imageConversion';

type Props = { 
  uid: string; 
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
};

export default function MasterAvatarInput({ uid, onUploaded, currentUrl }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    try {
      // Convert any format → normalized format
      const converted = await convertToUploadableImage(file);

      // Size guard: reject if > 8MB after conversion
      if (converted.blob.size > 8 * 1024 * 1024) {
        return;
      }

      // Create preview from converted blob
      const previewUrl = URL.createObjectURL(converted.blob);
      setPreview(previewUrl);

      // Debug logging
      console.info("[BR] will upload", file.name, file.type, file.size);

      // Upload using server-side API
      const filename = `profiles/${uid}/avatar-${Date.now()}.${converted.ext}`;
      const uploadFile = new File([converted.blob], `avatar.${converted.ext}`, { type: converted.contentType });
      const { url } = await uploadImage(uploadFile, filename);
      onUploaded(url);
    } catch (err: any) {
      console.error(err);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <label className="text-sm font-medium">Avatar</label>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-gray-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="Current avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No photo</div>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*,.heic,.heif,.tiff,.bmp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              disabled={isUploading}
              className="max-w-full"
            />
          </div>
          {isUploading && <p className="text-sm text-gray-600 break-words whitespace-normal">Uploading…</p>}
          {preview && (
            <button 
              type="button" 
              className="text-sm text-gray-600 underline break-words whitespace-normal" 
              onClick={() => {
                setPreview(null);
                URL.revokeObjectURL(preview);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-snug break-words whitespace-normal max-w-full">
        You can upload any common photo format. We will convert it to WebP/JPEG automatically. Max 8MB.
      </p>
    </div>
  );
}
