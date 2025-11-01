export function getListingCoverUrl(listing: any): string | null {
  if (!listing) return null;

  // Helper to extract URL from string or object
  const getUrl = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string" && v.length > 0) return v.trim();
    if (typeof v === "object") {
      return (v.url || v.downloadURL || v.src || v.imageUrl || "").toString().trim();
    }
    return null;
  };

  // explicit cover fields (single images)
  const coverUrl = getUrl(listing.coverPhoto) || 
                   getUrl(listing._coverPhoto) || 
                   getUrl(listing.coverUrl) ||
                   getUrl(listing.mainPhoto) ||
                   getUrl(listing.photoUrl) ||
                   getUrl(listing.imageUrl) ||
                   getUrl(listing.coverImage);
  
  if (coverUrl) return coverUrl;

  // arrays: photos, images, gallery, previewPhotos
  const arrays = [
    listing.photos,
    listing.images,
    listing.gallery,
    listing.previewPhotos,
    listing.coverPhotos,
  ];

  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length > 0) {
      const url = getUrl(arr[0]);
      if (url) return url;
    }
  }

  return null;
}
