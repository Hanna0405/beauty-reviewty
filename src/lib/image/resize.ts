export async function downscaleToWebp(file: File, max = 1600, quality = 0.85): Promise<File> {
 const img = document.createElement('img');
 img.src = URL.createObjectURL(file);
 await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; });

 const canvas = document.createElement('canvas');
 const ratio = Math.min(1, max / Math.max(img.width, img.height));
 canvas.width = Math.round(img.width * ratio);
 canvas.height = Math.round(img.height * ratio);

 const ctx = canvas.getContext('2d')!;
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

 const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/webp', quality));
 URL.revokeObjectURL(img.src);
 if (!blob) return file;
 return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
}
