/**
 * Utility function to sanitize profile data before sending to Firestore
 * Ensures no undefined values exist, which would cause Firestore errors
 */

export interface SanitizedProfileData {
  displayName: string;
  city: string;
  services: string[];
  languages: string[];
  avatarUrl: string | null;
  uid: string;
  about: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  coords: { lat: number; lng: number } | null;
}

export function sanitizeProfileData(rawData: any, uid: string, avatarUrl: string | null): SanitizedProfileData {
  // Helper function to safely get string value
  const safeString = (value: any, fallback: string = ''): string => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return fallback;
  };

  // Helper function to safely get array value
  const safeArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(item => typeof item === 'string' && item.trim());
    return [];
  };

  // Helper function to safely get number value
  const safeNumber = (value: any): number | null => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    return null;
  };

  // Helper function to safely get coordinates
  const safeCoords = (cityData: any): { lat: number; lng: number } | null => {
    if (cityData?.lat && cityData?.lng && 
        typeof cityData.lat === 'number' && typeof cityData.lng === 'number' &&
        !isNaN(cityData.lat) && !isNaN(cityData.lng)) {
      return { lat: cityData.lat, lng: cityData.lng };
    }
    return null;
  };

  const sanitizedData: SanitizedProfileData = {
    displayName: safeString(rawData.name || rawData.displayName, ''),
    city: safeString(rawData.city?.label || rawData.city, ''),
    services: safeArray(rawData.services),
    languages: safeArray(rawData.languages),
    avatarUrl: avatarUrl, // This should already be sanitized (string | null)
    uid: uid,
    about: safeString(rawData.about || rawData.bio, ''),
    priceFrom: safeNumber(rawData.priceFrom || rawData.priceMin),
    priceTo: safeNumber(rawData.priceTo || rawData.priceMax),
    coords: safeCoords(rawData.city),
  };

  // Final validation - ensure no undefined values exist
  Object.keys(sanitizedData).forEach(key => {
    if (sanitizedData[key as keyof SanitizedProfileData] === undefined) {
      console.warn(`[sanitizeProfileData] Found undefined value for field: ${key}, setting to null`);
      (sanitizedData as any)[key] = null;
    }
  });

  return sanitizedData;
}
