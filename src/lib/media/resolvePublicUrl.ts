"use client";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebaseClient";

export async function resolvePublicUrl(input: any): Promise<string | null> {
  if (!input) return null;
  const candidate = typeof input === "string" ? input : input?.url;
  if (!candidate || typeof candidate !== "string") return null;

  // already public
  if (/^https?:\/\//i.test(candidate)) return candidate;

  try {
    const r = ref(storage, candidate); // works for gs:// and plain paths
    return await getDownloadURL(r);
  } catch {
    return null;
  }
}

/**
 * Resolves review images for an array of reviews
 * Returns reviews with _images property containing resolved URLs
 */
export async function resolveReviewImages(reviews: any[]): Promise<any[]> {
  const processedReviews = await Promise.all(
    reviews.map(async (review) => {
      const pool: any[] = [];
      
      // Try various common fields for review images
      if (Array.isArray(review.photos)) pool.push(...review.photos);
      if (Array.isArray(review.imageUrls)) pool.push(...review.imageUrls);
      if (Array.isArray(review._images)) pool.push(...review._images);
      if (review.imageUrl) pool.push(review.imageUrl);
      if (review.photoUrl) pool.push(review.photoUrl);
      if (review.image) pool.push(review.image);
      if (review.photo) pool.push(review.photo);
      
      // Extract URLs from objects if they have url property
      const rawUrls = pool.flat().filter(Boolean).map(item => 
        typeof item === 'string' ? item : item?.url
      ).filter(Boolean);
      
      // Resolve all URLs to public HTTPS URLs
      const resolvedUrls = await Promise.all(rawUrls.map(resolvePublicUrl));
      const validUrls = resolvedUrls.filter(Boolean) as string[];
      
      // Remove duplicates while preserving order
      const uniqueUrls = Array.from(new Set(validUrls));
      
      return {
        ...review,
        _images: uniqueUrls
      };
    })
  );
  
  return processedReviews;
}
