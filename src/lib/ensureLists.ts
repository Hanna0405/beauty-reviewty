export type SimpleItem = { key: string; name: string; emoji?: string };

export function ensureSelectedArray(arr: SimpleItem[] | null | undefined, min = 0) {
  const a = Array.isArray(arr) ? arr : [];
  const seen = new Set<string>();
  const deduped: SimpleItem[] = [];
  for (const it of a) {
    if (!it?.key || !it?.name) throw new Error('Selections must come from the predefined list.');
    if (!seen.has(it.key)) {
      seen.add(it.key);
      deduped.push({ key: it.key, name: it.name, emoji: it.emoji });
    }
  }
  if (deduped.length < min) throw new Error('Please select required items from the list.');
  return deduped;
}

export function deriveMirrors(arr: SimpleItem[]) {
  const keys = arr.map(x => x.key);
  const names = arr.map(x => x.name);
  return { keys, names };
}