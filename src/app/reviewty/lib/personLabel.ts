import type { MinimalMaster } from "./joinMasters";

export function formatPhoneMask(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.length < 6) return digits;
  
  // mask middle part: +1 (647) ***-**12
  return digits.replace(/(\+?\d{1,3})?(\d{3})(\d{2,3})(\d{2})(\d{2})?/, (_, c, a, b, d, e) => {
    const head = [c, a].filter(Boolean).join(" ");
    const tail = [d, e].filter(Boolean).join("-");
    return `${head} ***-${tail}`.trim();
  });
}

export function buildPersonLabel(review: any, master?: MinimalMaster) {
  const fromReview = review.displayName || review.nickname || review.contactName || review.phone || null;
  const fromProfile = master?.displayName || master?.nickname || master?.phone || null;
  const raw = fromProfile || fromReview || null;

  if (!raw) return null;

  // Prefer masking phone
  if (/[\d+][\d\s\-()]{4,}/.test(String(raw))) {
    return formatPhoneMask(String(raw)) || String(raw);
  }
  
  return String(raw);
}
