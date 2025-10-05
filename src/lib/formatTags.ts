import type { TagOption } from '@/types/tags';

export function tagLabel(t: TagOption | { name?: string; emoji?: string } | string): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  const name = 'name' in t && t.name ? t.name : '';
  const emoji = 'emoji' in t && t.emoji ? t.emoji : '';
  return [emoji, name].filter(Boolean).join(' ').trim();
}

export function renderTagList(
  items?: Array<TagOption | { name?: string; emoji?: string } | string>
): string[] {
  if (!Array.isArray(items)) return [];
  return items.map(tagLabel).filter(Boolean);
}
