// Services with emojis
export const SERVICE_OPTIONS = [
  { value: "Hair", label: "Hair 💇" },
  { value: "Nails", label: "Nails 💅" },
  { value: "Makeup", label: "Makeup 💄" },
  { value: "Lashes", label: "Lashes 👁️" },
  { value: "Brows", label: "Brows 👁️" },
  { value: "Cosmetology", label: "Cosmetology ✨" },
  { value: "Botox", label: "Botox 💉" },
  { value: "Lips filler", label: "Lips filler 💋" },
];

// Languages with flags
export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English 🇬🇧" },
  { value: "Ukrainian", label: "Українська 🇺🇦" },
  { value: "Russian", label: "Русский 🇷🇺" },
  { value: "Polish", label: "Polski 🇵🇱" },
  { value: "Spanish", label: "Español 🇪🇸" },
  { value: "French", label: "Français 🇫🇷" },
  { value: "Italian", label: "Italiano 🇮🇹" },
  { value: "Portuguese", label: "Português 🇵🇹" },
];

// Helper to map flags if needed
export function flag(code: string) {
  // code = "CA", "UA", ...
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + (c.charCodeAt(0) - 65)));
}
