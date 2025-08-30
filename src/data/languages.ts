export const LANGUAGES = [
  "English",
  "French", 
  "Russian",
  "Ukrainian",
  "Polish",
  "Portuguese",
  "Spanish",
  "Italian",
  "German",
  "Mandarin Chinese",
  "Cantonese",
  "Punjabi",
  "Hindi",
  "Tagalog (Filipino)",
  "Korean",
  "Japanese",
  "Vietnamese",
  "Arabic",
  "Persian (Farsi)",
  "Turkish"
] as const;

export type Language = typeof LANGUAGES[number];
