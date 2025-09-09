export type ConvertedImage = { blob: Blob; ext: "webp" | "jpg" | "png"; contentType: string };

// Browser-readable types
const READABLE = new Set(["image/jpeg","image/png","image/webp"]);
const looksHeic = (f: File) =>
  f.type.includes("heic") || f.type.includes("heif") ||
  f.name.toLowerCase().endsWith(".heic") || f.name.toLowerCase().endsWith(".heif");

async function toBitmap(blob: Blob): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) return await createImageBitmap(blob);
  // Fallback decode via <img> + canvas
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("decode failed"));
      i.src = url;
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d"); if (!ctx) throw new Error("no 2d");
    ctx.drawImage(img, 0, 0);
    const b: Blob = await new Promise((res, rej)=>c.toBlob((bb)=>bb?res(bb):rej(new Error("toBlob failed"))));
    // @ts-ignore
    return "createImageBitmap" in window ? await createImageBitmap(b) : (b as any);
  } finally { URL.revokeObjectURL(url); }
}

async function encode(bitmap: ImageBitmap, type: "image/webp"|"image/jpeg", q=0.9): Promise<Blob> {
  const c = document.createElement("canvas");
  // @ts-ignore width/height are present on ImageBitmap
  c.width = bitmap.width; c.height = bitmap.height;
  const ctx = c.getContext("2d"); if (!ctx) throw new Error("no 2d");
  // @ts-ignore
  ctx.drawImage(bitmap, 0, 0);
  return await new Promise<Blob>((res, rej)=>c.toBlob((b)=>b?res(b):rej(new Error("toBlob failed")), type, q));
}

/** Convert arbitrary file to uploadable image.
 * - If already JPEG/PNG/WebP (<=8MB) → pass-through (NO throwing).
 * - If HEIC/HEIF → convert to JPEG via heic2any.
 * - Else → decode and re-encode to WebP; fallback to JPEG if WebP fails.
 */
export async function convertToUploadableImage(file: File): Promise<ConvertedImage> {
  // Fast path: pass-through for common types
  if (READABLE.has(file.type) && file.size <= 8*1024*1024) {
    const ext = file.type.split("/")[1] as "jpg"|"png"|"webp";
    return { blob: file, ext: ext, contentType: file.type };
  }

  let blob: Blob = file;

  // HEIC first step → JPEG
  if (looksHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })) as Blob;
  }

  // Try decode → encode preferred WebP
  try {
    const bmp = await toBitmap(blob);
    try {
      const webp = await encode(bmp, "image/webp", 0.9);
      return { blob: webp, ext: "webp", contentType: "image/webp" };
    } catch {
      const jpg = await encode(bmp, "image/jpeg", 0.92);
      return { blob: jpg, ext: "jpg", contentType: "image/jpeg" };
    }
  } catch {
    // Last resort: if original was readable, pass through; otherwise friendly error
    if (READABLE.has(file.type)) {
      const ext = file.type.split("/")[1] as "jpg"|"png"|"webp";
      return { blob: file, ext: ext, contentType: file.type };
    }
    throw new Error("This image format isn't supported by your browser. Please pick another file.");
  }
}
