export function buildUrl(pathname: string, params?: Record<string, any>) {
  if (!params || Object.keys(params).length === 0) return pathname;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) v.forEach(item => qs.append(k, String(item)));
    else qs.set(k, String(v));
  }
  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}
