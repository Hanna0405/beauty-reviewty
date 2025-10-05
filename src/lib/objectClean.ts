export function pruneUndefinedDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj)) return obj.map(pruneUndefinedDeep) as any;
  const out: any = {};
  for (const [k, v] of Object.entries(obj as any)) {
    if (v === undefined) continue;
    out[k] = pruneUndefinedDeep(v as any);
  }
  return out;
}

export function emptyStringsToNullDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return (obj === '' ? null as any : obj);
  if (Array.isArray(obj)) return obj.map(emptyStringsToNullDeep) as any;
  const out: any = {};
  for (const [k, v] of Object.entries(obj as any)) {
    const vv = emptyStringsToNullDeep(v as any);
    out[k] = vv === '' ? null : vv;
  }
  return out;
}
