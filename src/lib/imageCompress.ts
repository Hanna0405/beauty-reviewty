/**
 * Client-side image compression utility
 * Resizes images and converts to JPEG with specified quality
 */

/**
 * Check if file is HEIC/HEIF format
 */
function looksHeic(file: File): boolean {
  return (
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

/**
 * Convert HEIC/HEIF to JPEG using heic2any
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    return Array.isArray(result) ? result[0] : (result as Blob);
  } catch (error) {
    console.warn(
      "[imageCompress] HEIC conversion failed, falling back to original:",
      error
    );
    throw error;
  }
}

/**
 * Load image as ImageBitmap or HTMLImageElement (with fallback)
 */
async function loadImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob);
    } catch (error) {
      // Fallback to HTMLImageElement if createImageBitmap fails
      console.warn(
        "[imageCompress] createImageBitmap failed, using fallback:",
        error
      );
    }
  }

  // Fallback: use HTMLImageElement
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Resize and compress image to JPEG
 * @param file - Original image file
 * @param opts - Compression options: maxSide (longest dimension), quality (0-1)
 * @returns Compressed File in JPEG format
 */
export async function compressImage(
  file: File,
  opts: { maxSide: number; quality: number }
): Promise<File> {
  const { maxSide, quality } = opts;

  try {
    // Step 1: Convert HEIC/HEIF to JPEG if needed
    let blob: Blob = file;
    if (looksHeic(file)) {
      try {
        blob = await convertHeicToJpeg(file);
      } catch (error) {
        // If HEIC conversion fails, fallback to original file
        console.warn(
          "[imageCompress] HEIC conversion failed, using original file"
        );
        return file;
      }
    }

    // Step 2: Load image
    const image = await loadImage(blob);

    // Step 3: Calculate new dimensions (preserve aspect ratio)
    const width = image.width || (image as HTMLImageElement).naturalWidth || 0;
    const height =
      image.height || (image as HTMLImageElement).naturalHeight || 0;

    if (width === 0 || height === 0) {
      console.warn(
        "[imageCompress] Invalid image dimensions, using original file"
      );
      return file;
    }

    const maxDimension = Math.max(width, height);
    if (maxDimension <= maxSide) {
      // Image is already smaller than maxSide, just convert to JPEG if needed
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        return file; // Already JPEG, no compression needed
      }
      // Need to convert format only
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;
    if (maxDimension > maxSide) {
      const ratio = maxSide / maxDimension;
      newWidth = Math.round(width * ratio);
      newHeight = Math.round(height * ratio);
    }

    // Step 4: Create canvas and draw resized image
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Draw image to canvas (handles both ImageBitmap and HTMLImageElement)
    if (image instanceof ImageBitmap) {
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
      image.close(); // Clean up ImageBitmap
    } else {
      ctx.drawImage(image as HTMLImageElement, 0, 0, newWidth, newHeight);
    }

    // Step 5: Export as JPEG blob
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        },
        "image/jpeg",
        quality
      );
    });

    // Step 6: Create new File with .jpg extension
    const originalName = file.name.replace(/\.[^.]+$/, ""); // Remove extension
    const newName = `${originalName}.jpg`;
    return new File([compressedBlob], newName, { type: "image/jpeg" });
  } catch (error) {
    // On any error, fallback to original file (do NOT block upload)
    console.warn(
      "[imageCompress] Compression failed, using original file:",
      error
    );
    return file;
  }
}
