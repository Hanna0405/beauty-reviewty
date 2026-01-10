"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/upload-image";
import { convertToUploadableImage } from "@/lib/imageConversion";
import { compressImage } from "@/lib/imageCompress";

type Props = {
  uid: string;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
};

export default function MasterAvatarInput({
  uid,
  onUploaded,
  currentUrl,
}: Props) {
  const uploadLockRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File) {
    // Double-click protection: ref guard at the very top
    if (uploadLockRef.current) return;
    uploadLockRef.current = true;
    setIsUploading(true);

    try {
      // Check if file is already browser-readable (no conversion needed)
      const READABLE_TYPES = new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]);
      const isReadable =
        READABLE_TYPES.has(file.type) && file.size <= 8 * 1024 * 1024;

      let uploadFile: File;
      let filename: string;
      let previewUrl: string;

      if (isReadable) {
        // Compress and resize avatar: max 512px, quality 0.82
        uploadFile = await compressImage(file, { maxSide: 512, quality: 0.82 });
        filename = `profiles/${uid}/avatar-${Date.now()}.jpg`;
        previewUrl = URL.createObjectURL(uploadFile);
      } else {
        // Convert non-readable formats (HEIC, TIFF, etc.) first
        const converted = await convertToUploadableImage(file);

        // Size guard: reject if > 8MB after conversion
        if (converted.blob.size > 8 * 1024 * 1024) {
          return;
        }

        // Then compress the converted image
        const convertedFile = new File(
          [converted.blob],
          `avatar.${converted.ext}`,
          { type: converted.contentType }
        );
        uploadFile = await compressImage(convertedFile, {
          maxSide: 512,
          quality: 0.82,
        });
        filename = `profiles/${uid}/avatar-${Date.now()}.jpg`;
        previewUrl = URL.createObjectURL(uploadFile);
      }

      // Create preview
      setPreview(previewUrl);

      // Debug logging
      console.info(
        "[BR] will upload",
        uploadFile.name,
        uploadFile.type,
        uploadFile.size
      );

      // Upload using server-side API
      const { url } = await uploadImage(uploadFile, filename);
      onUploaded(url);
    } catch (err: any) {
      console.error("[MasterAvatarInput] Upload error:", {
        raw: err,
        typeof: typeof err,
        jsonStringified: (() => {
          try {
            return JSON.stringify(err);
          } catch {
            return "[JSON.stringify failed]";
          }
        })(),
        name: err?.name,
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
        keys: err && typeof err === "object" ? Object.keys(err) : undefined,
      });
      setPreview(null);
    } finally {
      uploadLockRef.current = false;
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
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="Current avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
              No photo
            </div>
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
              disabled={isUploading || uploadLockRef.current}
              className="max-w-full"
            />
          </div>
          {isUploading && (
            <p className="text-sm text-gray-600 break-words whitespace-normal">
              Uploading…
            </p>
          )}
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
        You can upload any common photo format. We will convert it to WebP/JPEG
        automatically. Max 8MB.
      </p>
    </div>
  );
}
