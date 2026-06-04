import { compressImage } from "@/lib/imageCompress";
import { convertToUploadableImage } from "@/lib/imageConversion";

export const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
export const REVIEW_PHOTO_MAX_SIDE = 1600;
export const REVIEW_PHOTO_QUALITY = 0.82;

export const PHOTO_PROCESS_ERROR =
  "We couldn't process that photo. Try a JPG or PNG, or pick another image from your library.";

export const PHOTO_TOO_LARGE_ERROR =
  "That photo is too large. Please choose an image under 8 MB.";

function isLikelyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const name = file.name.toLowerCase();
  return /\.(heic|heif|jpg|jpeg|png|webp|tiff|bmp)$/i.test(name);
}

/**
 * Normalize HEIC/large photos to a compressed JPEG/WebP File safe for upload & canvas OCR.
 */
export async function prepareReviewPhotoFile(file: File): Promise<File> {
  if (!isLikelyImage(file)) {
    throw new Error(PHOTO_PROCESS_ERROR);
  }

  try {
    const converted = await convertToUploadableImage(file);
    const baseName = (file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
    const ext =
      converted.ext === "jpg"
        ? "jpg"
        : converted.ext === "webp"
          ? "webp"
          : "png";

    const intermediate = new File([converted.blob], `${baseName}.${ext}`, {
      type: converted.contentType,
    });

    const compressed = await compressImage(intermediate, {
      maxSide: REVIEW_PHOTO_MAX_SIDE,
      quality: REVIEW_PHOTO_QUALITY,
    });

    if (compressed.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new Error(PHOTO_TOO_LARGE_ERROR);
    }

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.info("[prepareReviewPhoto]", {
        from: { name: file.name, type: file.type, size: file.size },
        to: {
          name: compressed.name,
          type: compressed.type,
          size: compressed.size,
        },
      });
    }

    return compressed;
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === PHOTO_TOO_LARGE_ERROR) throw err;
      if (err.message.includes("isn't supported")) {
        throw new Error(PHOTO_PROCESS_ERROR);
      }
    }
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[prepareReviewPhoto] failed", err);
    }
    throw new Error(PHOTO_PROCESS_ERROR);
  }
}

export async function prepareReviewPhotoFiles(
  files: File[],
  max = 3
): Promise<File[]> {
  const prepared: File[] = [];
  for (const file of (files ?? []).slice(0, max)) {
    prepared.push(await prepareReviewPhotoFile(file));
  }
  return prepared;
}

/** HEIC-safe source file for skincare OCR (run before optimizeImageForOcr). */
export async function prepareOcrSourceFile(file: File): Promise<File> {
  return prepareReviewPhotoFile(file);
}
