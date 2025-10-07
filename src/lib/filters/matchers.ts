/**
 * Helper function to check if target array includes ALL required items
 * Used for AND logic filtering (e.g., must have ALL selected services/languages)
 * Uses Set for better performance on larger arrays
 */
export function includesAll(target: string[] | undefined | null, required: string[]): boolean {
  if (!required?.length) return true;
  const set = new Set((target ?? []).filter(Boolean));
  if (!set.size) return false;
  return required.every(k => set.has(k));
}

