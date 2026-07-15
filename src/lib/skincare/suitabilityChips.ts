/**
 * Suitability chips for "Is it right for you?" (Good for / Be careful).
 * Supports API aliases + string/array shapes from the model.
 */

const CHIP_MAX_LEN = 28;
const CHIP_MAX_ITEMS = 3;

const GOOD_FOR_KEYS = [
  "goodFor",
  "bestFor",
  "good_for",
  "suitableFor",
  "recommendedFor",
  "best_for",
  "skinTypes",
] as const;

const BE_CAREFUL_KEYS = [
  "beCareful",
  "notIdealFor",
  "be_careful",
  "not_ideal_for",
  "caution",
  "cautions",
  "warnings",
  "avoidIf",
  "avoid_if",
] as const;

export type SuitabilityChips = {
  goodFor: string[];
  beCareful: string[];
  /** Legacy aliases kept for older clients / UI. */
  bestFor: string[];
  notIdealFor: string[];
};

function shortChip(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= CHIP_MAX_LEN) return t;
  return `${t.slice(0, CHIP_MAX_LEN - 1)}…`;
}

function itemToString(item: unknown): string {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";
  const rec = item as Record<string, unknown>;
  for (const key of ["name", "label", "text", "value", "note"] as const) {
    const v = rec[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function splitLooseString(s: string): string[] {
  const t = s.trim();
  if (!t) return [];
  if (/[,;|]/.test(t) || /\n/.test(t)) {
    return t
      .split(/[,;|\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [t];
}

/** Accept string, string[], or lightly-structured objects. */
export function chipStringArray(v: unknown, maxItems = CHIP_MAX_ITEMS): string[] {
  let raw: string[] = [];
  if (typeof v === "string") {
    raw = splitLooseString(v);
  } else if (Array.isArray(v)) {
    raw = v.map(itemToString).filter(Boolean);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const chip = shortChip(s);
    if (!chip) continue;
    const key = chip.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(chip);
    if (out.length >= maxItems) break;
  }
  return out;
}

function pickFirstChips(
  source: Record<string, unknown>,
  keys: readonly string[],
  maxItems = CHIP_MAX_ITEMS
): string[] {
  for (const key of keys) {
    if (!(key in source)) continue;
    const chips = chipStringArray(source[key], maxItems);
    if (chips.length > 0) return chips;
  }
  return [];
}

type FallbackContext = {
  skinType?: string;
  skinGoals?: string[];
  productType?: string;
  summary?: string;
  statusText?: string;
  scoreExplanation?: {
    skinFit?: string;
    goalFit?: string;
    helpfulIngredients?: { name?: string; note?: string }[];
    cautionIngredients?: { name?: string; note?: string }[];
  };
  why?: string[];
  ingredientsToNotice?: { name?: string; note?: string }[];
};

function productTypeFallbacks(productType: string | undefined): {
  good: string[];
  careful: string[];
} {
  const t = (productType ?? "").toLowerCase();
  if (t === "moisturizer") {
    return {
      good: ["Dry or dehydrated skin", "Daily moisture support"],
      careful: ["Very oily skin", "Heavy-cream preference only"],
    };
  }
  if (t === "serum") {
    return {
      good: ["Targeted treatment goals", "Layering under moisturizer"],
      careful: ["Over-exfoliated skin", "New active beginners"],
    };
  }
  if (t === "sunscreen") {
    return {
      good: ["Daily UV protection", "Outdoor daytime wear"],
      careful: ["Eye-area sting risk", "Finish/texture preferences"],
    };
  }
  if (t === "cleanser") {
    return {
      good: ["Daily face cleansing", "Makeup or SPF removal"],
      careful: ["Very dry skin", "Over-washing habits"],
    };
  }
  if (t === "toner") {
    return {
      good: ["Hydration prep step", "Light texture fans"],
      careful: ["Alcohol-heavy formulas", "Broken skin barrier"],
    };
  }
  if (t === "acne treatment") {
    return {
      good: ["Blemish-prone skin", "Clearer-looking goals"],
      careful: ["Very sensitive skin", "Overuse of actives"],
    };
  }
  if (t === "face oil") {
    return {
      good: ["Dry skin seal step", "Glow / softness goals"],
      careful: ["Very oily skin", "Clog-prone preferences"],
    };
  }
  if (t === "mask") {
    return {
      good: ["Weekly treatment ritual", "Targeted skin goals"],
      careful: ["Leave-on misuse", "Reactive / irritated skin"],
    };
  }
  return {
    good: ["General daily skincare", "Ingredient-aware routines"],
    careful: ["Patch-test first", "Personal sensitivity"],
  };
}

function textBlob(ctx: FallbackContext): string {
  const parts: string[] = [];
  if (ctx.summary) parts.push(ctx.summary);
  if (ctx.statusText) parts.push(ctx.statusText);
  if (ctx.scoreExplanation?.skinFit) parts.push(ctx.scoreExplanation.skinFit);
  if (ctx.scoreExplanation?.goalFit) parts.push(ctx.scoreExplanation.goalFit);
  for (const w of ctx.why ?? []) parts.push(w);
  for (const i of ctx.ingredientsToNotice ?? []) {
    if (i.name) parts.push(i.name);
    if (i.note) parts.push(i.note);
  }
  for (const i of ctx.scoreExplanation?.cautionIngredients ?? []) {
    if (i.name) parts.push(i.name);
    if (i.note) parts.push(i.note);
  }
  for (const i of ctx.scoreExplanation?.helpfulIngredients ?? []) {
    if (i.name) parts.push(i.name);
    if (i.note) parts.push(i.note);
  }
  return parts.join(" ").toLowerCase();
}

function inferFromText(blob: string): { good: string[]; careful: string[] } {
  const good: string[] = [];
  const careful: string[] = [];

  if (/\b(retinol|retinoid|adapalene|tretinoin)\b/.test(blob)) {
    good.push("Experienced active users");
    careful.push("New to retinoids");
    careful.push("Very sensitive skin");
  }
  if (
    /\b(aha|bha|pha|glycolic|lactic|salicylic|mandelic|exfoliat)\b/.test(blob)
  ) {
    good.push("Texture / clarity goals");
    careful.push("Over-exfoliated skin");
  }
  if (/\b(fragrance|parfum|perfume)\b/.test(blob)) {
    careful.push("Fragrance sensitivity");
  }
  if (/\b(alcohol denat|denatured alcohol)\b/.test(blob)) {
    careful.push("Very dry skin");
  }
  if (/\b(ceramide|hyaluronic|glycerin|squalane|panthenol)\b/.test(blob)) {
    good.push("Dry or dehydrated skin");
    good.push("Daily moisture support");
  }
  if (/\b(niacinamide)\b/.test(blob)) {
    good.push("Uneven tone concerns");
  }
  if (/\b(sensitive|irritat|sting|reactive)\b/.test(blob)) {
    careful.push("Very sensitive skin");
  }

  return {
    good: chipStringArray(good, CHIP_MAX_ITEMS),
    careful: chipStringArray(careful, CHIP_MAX_ITEMS),
  };
}

export function buildSuitabilityFallbacks(
  ctx: FallbackContext
): { goodFor: string[]; beCareful: string[] } {
  const fromType = productTypeFallbacks(ctx.productType);
  const fromText = inferFromText(textBlob(ctx));
  const good: string[] = [];
  const careful: string[] = [];

  if (ctx.skinType?.trim()) {
    good.push(shortChip(`${ctx.skinType.trim()} skin`));
  }
  for (const g of ctx.skinGoals ?? []) {
    if (good.length >= CHIP_MAX_ITEMS) break;
    const chip = shortChip(g);
    if (chip) good.push(chip);
  }

  for (const g of fromText.good) {
    if (good.length >= CHIP_MAX_ITEMS) break;
    if (!good.some((x) => x.toLowerCase() === g.toLowerCase())) good.push(g);
  }
  for (const g of fromType.good) {
    if (good.length >= CHIP_MAX_ITEMS) break;
    if (!good.some((x) => x.toLowerCase() === g.toLowerCase())) good.push(g);
  }

  for (const c of ctx.scoreExplanation?.cautionIngredients ?? []) {
    if (careful.length >= CHIP_MAX_ITEMS) break;
    if (c.name?.trim()) careful.push(shortChip(c.name));
  }
  for (const c of ctx.ingredientsToNotice ?? []) {
    if (careful.length >= CHIP_MAX_ITEMS) break;
    if (c.name?.trim()) careful.push(shortChip(c.name));
  }
  for (const c of fromText.careful) {
    if (careful.length >= CHIP_MAX_ITEMS) break;
    if (!careful.some((x) => x.toLowerCase() === c.toLowerCase())) {
      careful.push(c);
    }
  }
  for (const c of fromType.careful) {
    if (careful.length >= CHIP_MAX_ITEMS) break;
    if (!careful.some((x) => x.toLowerCase() === c.toLowerCase())) {
      careful.push(c);
    }
  }

  return {
    goodFor: chipStringArray(good, CHIP_MAX_ITEMS),
    beCareful: chipStringArray(careful, CHIP_MAX_ITEMS),
  };
}

/**
 * Normalize suitability fields from a raw API/model object.
 * Never replaces non-empty chips with empty arrays.
 */
export function normalizeSuitabilityChips(
  source: unknown,
  ctx: FallbackContext = {}
): SuitabilityChips {
  const rec =
    source && typeof source === "object"
      ? (source as Record<string, unknown>)
      : {};

  let goodFor = pickFirstChips(rec, GOOD_FOR_KEYS);
  let beCareful = pickFirstChips(rec, BE_CAREFUL_KEYS);

  if (goodFor.length === 0 || beCareful.length === 0) {
    const fb = buildSuitabilityFallbacks({
      ...ctx,
      summary:
        ctx.summary ??
        (typeof rec.summary === "string" ? rec.summary : undefined),
      statusText:
        ctx.statusText ??
        (typeof rec.statusText === "string" ? rec.statusText : undefined),
      productType:
        ctx.productType ??
        (typeof rec.productType === "string" ? rec.productType : undefined),
      scoreExplanation:
        ctx.scoreExplanation ??
        (rec.scoreExplanation && typeof rec.scoreExplanation === "object"
          ? (rec.scoreExplanation as FallbackContext["scoreExplanation"])
          : undefined),
      why: ctx.why ?? (Array.isArray(rec.why) ? (rec.why as string[]) : undefined),
      ingredientsToNotice:
        ctx.ingredientsToNotice ??
        (Array.isArray(rec.ingredientsToNotice)
          ? (rec.ingredientsToNotice as FallbackContext["ingredientsToNotice"])
          : undefined),
    });
    if (goodFor.length === 0) goodFor = fb.goodFor;
    if (beCareful.length === 0) beCareful = fb.beCareful;
  }

  return {
    goodFor,
    beCareful,
    bestFor: goodFor,
    notIdealFor: beCareful,
  };
}
