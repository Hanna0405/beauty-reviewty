export function toNumberOrNull(input: any): number | null {
 const s = typeof input === "string" ? input.trim() : input;
 if (s === "" || s == null) return null;
 const n = Number(s);
 return Number.isFinite(n) ? n : null;
}
export function stripUndefined<T>(obj: T): T {
 if (obj == null || typeof obj !== "object") return obj;
 if (Array.isArray(obj)) return obj.map(stripUndefined).filter(v => v !== undefined) as any;
 const out: Record<string, any> = {};
 for (const [k,v] of Object.entries(obj)) if (v !== undefined) out[k] = stripUndefined(v);
 return out as T;
}
