import type { Timestamp } from "firebase-admin/firestore";

function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  );
}

export function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (isFirestoreTimestamp(value)) {
    const date = value.toDate();
    return {
      _seconds: Math.floor(date.getTime() / 1000),
      _nanoseconds: 0,
    };
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeValue(nested);
    }
    return out;
  }
  return value;
}

export function serializeFirestoreDoc<T extends Record<string, unknown>>(
  data: T
): T {
  return serializeValue(data) as T;
}
