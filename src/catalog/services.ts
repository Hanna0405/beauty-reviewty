export type CatalogItem = {
  key: string; // stable slug
  name: string; // EN label
  emoji?: string;
  aliases?: string[]; // for search
};

export const SERVICES: CatalogItem[] = [
  { key: 'hair-braids', name: 'Braids', emoji: ' ', aliases: ['braid','plaits','african braids'] },
  { key: 'hair-color', name: 'Hair Coloring', emoji: ' ', aliases: ['color','dye'] },
  { key: 'haircut', name: 'Haircut', emoji: ' ', aliases: ['cut','barber'] },
  { key: 'lashes', name: 'Lashes', emoji: ' ', aliases: ['eyelash','lash'] },
  { key: 'brows', name: 'Brows', emoji: ' ', aliases: ['brow','eyebrow','lamination'] },
  { key: 'nails', name: 'Nails', emoji: ' ', aliases: ['manicure','gel','acrylic'] },
  { key: 'makeup', name: 'Makeup', emoji: ' ', aliases: ['muah'] },
  { key: 'skincare', name: 'Skincare', emoji: ' ', aliases: ['facial','peel'] },
  { key: 'aesthetics-botox', name: 'Aesthetics — Botox', emoji: ' ', aliases: ['botox','tox'] },
  { key: 'aesthetics-fillers', name: 'Aesthetics — Lip Fillers', emoji: ' ', aliases: ['filler','lips'] },
  { key: 'pmu', name: 'Permanent Makeup (PMU)', emoji: ' ', aliases: ['tattoo','microblading'] },
  { key: 'massage', name: 'Massage', emoji: ' ', aliases: ['relax','therapeutic'] },
];
