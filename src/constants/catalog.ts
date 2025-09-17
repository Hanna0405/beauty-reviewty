// src/constants/catalog.ts
// Single source of truth for service & language options used across the app.

export type Option = { value: string; label: string; emoji?: string };

// NOTE: We import from the New Listing form if it already defines richer lists.
// If those exports don't exist in your project, keep the inline fallback below.

let SERVICES_FROM_NEW_LISTING: Option[] | null = null;
let LANGUAGES_FROM_NEW_LISTING: Option[] | null = null;

try {
  // Adjust these import paths if your New Listing form keeps options elsewhere.
  // Cursor: search the repo for arrays like "servicesOptions" or "SERVICE_OPTIONS" in the listing form.
  // Common places:
  // - src/app/dashboard/master/listings/new/ServiceSelect.tsx
  // - src/components/forms/ServiceSelect.tsx
  // - src/app/**/listings/**/constants.ts
  // The below are safe optional imports; if they fail, fallback arrays (below) are used.
  // @ts-ignore
  const mod = require('@/constants/options');
  if (mod?.SERVICES_OPTIONS) SERVICES_FROM_NEW_LISTING = mod.SERVICES_OPTIONS;
  if (mod?.LANGUAGE_OPTIONS) LANGUAGES_FROM_NEW_LISTING = mod.LANGUAGE_OPTIONS;
} catch (_) {
  // ignore; we'll use fallbacks
}

// FALLBACKS (broad categories). If the New Listing exports exist, these will be ignored.
const FALLBACK_SERVICE_OPTIONS: Option[] = [
  { value: 'Hair', label: 'Hair', emoji: '💇‍♀️' },
  { value: 'Hair Braids', label: 'Hair Braids', emoji: '🧶' },
  { value: 'Nails', label: 'Nails', emoji: '💅' },
  { value: 'Lashes', label: 'Lashes', emoji: '👁️' },
  { value: 'Brows', label: 'Brows', emoji: '🪄' },
  { value: 'Makeup', label: 'Makeup', emoji: '💄' },
  { value: 'Cosmetology', label: 'Cosmetology', emoji: '🧪' },
  { value: 'Botox', label: 'Botox', emoji: '💉' },
  { value: 'Lip Filler', label: 'Lip Filler', emoji: '👄' },
  { value: 'Laser Hair Removal', label: 'Laser Hair Removal', emoji: '🔦' },
  { value: 'Waxing', label: 'Waxing', emoji: '🕯️' },
  { value: 'Sugaring', label: 'Sugaring', emoji: '🍯' },
];

const FALLBACK_LANGUAGE_OPTIONS: Option[] = [
  { value: 'English', label: 'English', emoji: '🇬🇧' },
  { value: 'Ukrainian', label: 'Ukrainian', emoji: '🇺🇦' },
  { value: 'Russian', label: 'Russian', emoji: '🇷🇺' },
  { value: 'Polish', label: 'Polish', emoji: '🇵🇱' },
  { value: 'French', label: 'French', emoji: '🇫🇷' },
];

export const SERVICE_OPTIONS: Option[] = SERVICES_FROM_NEW_LISTING ?? FALLBACK_SERVICE_OPTIONS;
export const LANGUAGE_OPTIONS: Option[] = LANGUAGES_FROM_NEW_LISTING ?? FALLBACK_LANGUAGE_OPTIONS;
