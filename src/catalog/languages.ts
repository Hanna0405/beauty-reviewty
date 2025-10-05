import type { CatalogItem } from './services';

export const LANGUAGES: CatalogItem[] = [
  { key: 'en', name: 'English', emoji: ' ', aliases: ['english','eng'] },
  { key: 'uk', name: 'Ukrainian', emoji: ' ', aliases: ['ukrainian','ukr'] },
  { key: 'ru', name: 'Russian', emoji: ' ', aliases: ['russian','rus'] },
  { key: 'pl', name: 'Polish', emoji: ' ', aliases: ['polish','pol'] },
  { key: 'fr', name: 'French', emoji: ' ', aliases: ['french','fra'] },
  { key: 'es', name: 'Spanish', emoji: ' ', aliases: ['spanish','spa'] },
  { key: 'zh', name: 'Chinese', emoji: ' ', aliases: ['chinese','mandarin','zhong'] },
];

export type { CatalogItem } from './services';