/**
 * Personalized fit score: base (ingredient signals) + skin type + goals.
 * Same INCI text should shift meaningfully when skinType / goals change.
 */

const SKIN_GOALS_CANON = [
  "Hydration",
  "Glow",
  "Anti-aging",
  "Calm redness",
  "Barrier repair",
  "Acne support",
] as const;

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, needles: readonly string[]): boolean {
  return needles.some((n) => text.includes(n));
}

function countHits(text: string, needles: readonly string[]): number {
  let n = 0;
  for (const k of needles) {
    if (text.includes(k)) n += 1;
  }
  return n;
}

/** Strong humectants / hydrators */
const HUMECTANTS = [
  "glycerin",
  "glycerol",
  "hyaluronic",
  "sodium hyaluronate",
  "panthenol",
  "betaine",
  "propylene glycol",
  "butylene glycol",
  "pentylene glycol",
  "propanediol",
  "sodium pca",
  "pca",
  "mannitol",
  "erythritol",
  "trehalose",
  "beta-glucan",
] as const;

/** Oils / butters / rich emollients & occlusives */
const HEAVY_OILS_RICH = [
  "coconut oil",
  "cocos nucifera",
  "cocoa butter",
  "theobroma cacao",
  "shea butter",
  "butyrospermum parkii",
  "lanolin",
  "petrolatum",
  "paraffinum liquidum",
  "mineral oil",
  "palm oil",
  "elaeis guineensis",
  "avocado oil",
  "persea gratissima",
  "castor oil",
  "ricinus communis",
  "wheat germ oil",
  "triticum vulgare",
  "olive oil",
  "olea europaea",
] as const;

const LIGHT_CONTROL = [
  "niacinamide",
  "zinc pca",
  "zinc oxide",
  "silica",
  "kaolin",
  "salicylic acid",
  "betaine salicylate",
  "sodium salicylate",
  "willow bark",
  "salix",
] as const;

const BARRIER = [
  "ceramide",
  "cholesterol",
  "fatty acid",
  "phytosphingosine",
  "sphingosine",
  "petrolatum",
  "paraffin",
  "dimethicone",
  "cyclopentasiloxane",
  "squalane",
  "squalene",
  "lecithin",
  "shea butter",
  "butyrospermum parkii",
  "mango butter",
  "mangifera indica seed butter",
  "cholesterol sulfate",
] as const;

const OIL_BUTTER_EMOLLIENT = [
  "oil",
  "butter",
  "squalane",
  "esters",
  "caprylic",
  "capric triglyceride",
  "triglyceride",
  "jojoba",
  "ricinus communis",
] as const;

/** Irritants / sens. triggers */
const FRAGRANCE = [
  "fragrance",
  "parfum",
  "perfume",
  "essential oil",
  "lavender oil",
  "citrus aurantium",
  "limonene",
  "linalool",
  "citronellol",
  "geraniol",
  "eugenol",
  "coumarin",
  "citral",
  "hexyl cinnamal",
  "hydroxycitronellal",
] as const;

const ALCOHOL_DENAT = [
  "alcohol denat",
  "denatured alcohol",
  "sd alcohol",
  "alcohol 40",
] as const;

const TEA_TREE = ["tea tree", "melaleuca alternifolia", "melaleuca"] as const;

const MENTHOL_CAMPHOR = ["menthol", "mentholum", "camphor"] as const;

const DYES = [
  "fd&c",
  "d&c",
  "ci 15850",
  "ci 77491",
  "ci 77492",
  "ci 77499",
  "ci 77947",
  "yellow 5",
  "yellow 6",
  "red 40",
  "blue 1",
  "iron oxides",
] as const;

const EXFOL_ACIDS_STRONG = [
  "glycolic acid",
  "lactic acid",
  "mandelic acid",
  "tartaric acid",
  "gluconolactone",
  "glucono-delta-lactone",
  "salicylic acid",
  "betaine salicylate",
] as const;

const RETINOIDS = [
  "retinol",
  "retinal",
  "retinyl",
  "hydroxypinacolone retinoate",
  "adapalene",
  "tretinoin",
] as const;

const PEPTIDES = ["peptide", "palmitoyl", "dipeptide", "tripeptide", "tetrapeptide"] as const;

const VIT_C = [
  "ascorbic acid",
  "ascorbyl",
  "magnesium ascorbyl",
  "sodium ascorbyl",
  "ascorbyl glucoside",
  "tetrahexyldecyl ascorbate",
  "3-o-ethyl ascorbic",
] as const;

const ANTIOX = [
  "tocopherol",
  "tocotrienol",
  "ferulic acid",
  "resveratrol",
  "green tea",
  "camellia sinensis",
  "niacinamide",
  "ubiquinone",
] as const;

const SOOTHING = [
  "panthenol",
  "allantoin",
  "bisabolol",
  "beta-glucan",
  "centella asiatica",
  "madecassoside",
  "asiaticoside",
  "oat kernel",
  "avena sativa",
  "colloidal oatmeal",
  "green tea",
] as const;

const CENTELLA = ["centella", "madecassoside", "asiatica"] as const;

function splitIngredients(text: string): string[] {
  return text
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function highInList(items: string[], needles: readonly string[]): boolean {
  const top = items.slice(0, 6).join(", ");
  return hasAny(top, needles);
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function computeFormulaSignals(text: string) {
  const items = splitIngredients(text);
  const hum = countHits(text, HUMECTANTS);
  const barrier = countHits(text, BARRIER);
  const soothing = countHits(text, SOOTHING) + countHits(text, CENTELLA);
  const antiox = countHits(text, ANTIOX) + countHits(text, VIT_C);
  const niacin = text.includes("niacinamide") ? 1 : 0;
  const heavyRich = countHits(text, HEAVY_OILS_RICH) + countHits(text, OIL_BUTTER_EMOLLIENT);
  const fragranceHits = countHits(text, FRAGRANCE);
  const dyeHits = countHits(text, DYES);
  const alcoholHits = countHits(text, ALCOHOL_DENAT);
  const irritantHits =
    fragranceHits +
    alcoholHits +
    countHits(text, MENTHOL_CAMPHOR) +
    countHits(text, TEA_TREE) +
    dyeHits;
  const fragranceHigh = highInList(items, FRAGRANCE);
  const alcoholHigh = highInList(items, ALCOHOL_DENAT);
  const dyeHigh = highInList(items, DYES);
  const hasPreservative = hasAny(text, [
    "phenoxyethanol",
    "ethylhexylglycerin",
    "sodium benzoate",
    "potassium sorbate",
    "dehydroacetic acid",
    "benzyl alcohol",
    "chlorphenesin",
    "caprylyl glycol",
    "1,2-hexanediol",
  ]);

  const supportive = hum + barrier + soothing + antiox + niacin;
  const fillerHeavy = supportive <= 2 && items.length >= 10;
  const fattyAlcoholHits = countHits(text, [
    "cetyl alcohol",
    "stearyl alcohol",
    "cetearyl alcohol",
    "behenyl alcohol",
    "arachidyl alcohol",
  ]);
  const siliconeHits = countHits(text, [
    "dimethicone",
    "cyclopentasiloxane",
    "cyclohexasiloxane",
    "trimethicone",
    "silicone",
  ]);
  const waxOcclusiveHits = countHits(text, [
    "beeswax",
    "cera alba",
    "microcrystalline wax",
    "ozokerite",
    "petrolatum",
    "paraffin",
  ]);
  const richCreamLoad = heavyRich + fattyAlcoholHits + siliconeHits + waxOcclusiveHits;
  const botanicalExtractHits =
    (text.match(/\b[a-z\s-]+extract\b/g) || []).length +
    countHits(text, [
      "lavandula",
      "rosmarinus",
      "citrus",
      "eucalyptus",
      "mentha",
      "thymus",
      "melissa",
      "chamomilla",
      "matricaria",
      "rosa damascena",
      "jasminum",
    ]);

  return {
    hum,
    barrier,
    soothing,
    antiox,
    niacin,
    heavyRich,
    fragranceHits,
    alcoholHits,
    dyeHits,
    irritantHits,
    fragranceHigh,
    alcoholHigh,
    dyeHigh,
    hasPreservative,
    supportive,
    fillerHeavy,
    fattyAlcoholHits,
    siliconeHits,
    waxOcclusiveHits,
    richCreamLoad,
    botanicalExtractHits,
  };
}

function baseIngredientScore(text: string): {
  score: number;
  poorQuality: boolean;
  excellentQuality: boolean;
  strongIrritant: boolean;
  heavyRichFormula: boolean;
} {
  const s = computeFormulaSignals(text);

  const veryPoor =
    s.supportive <= 1 &&
    (s.fragranceHigh || s.alcoholHigh || s.irritantHits >= 4 || s.fillerHeavy);
  if (veryPoor) {
    const severe = s.fragranceHigh || s.alcoholHigh || s.irritantHits >= 5;
    const score = severe ? 1.5 : 2.5;
    return {
      score,
      poorQuality: true,
      excellentQuality: false,
      strongIrritant: s.fragranceHigh || s.irritantHits >= 4,
      heavyRichFormula: s.heavyRich >= 3,
    };
  }

  const highQuality =
    s.supportive >= 5 &&
    (s.hum >= 2 || s.barrier >= 2) &&
    (s.soothing >= 1 || s.niacin >= 1 || s.antiox >= 1) &&
    s.irritantHits <= 2;
  if (highQuality) {
    let score = 7.5;
    if (s.supportive >= 7) score += 0.5;
    if (s.barrier >= 2 && s.hum >= 2) score += 0.5;
    if (s.hasPreservative) score += 0.5;
    if (s.fragranceHits > 0 || s.alcoholHigh) score -= 0.5;
    return {
      score: Math.min(9, roundHalf(score)),
      poorQuality: false,
      excellentQuality: true,
      strongIrritant: s.fragranceHigh || s.irritantHits >= 4,
      heavyRichFormula: s.heavyRich >= 3,
    };
  }

  const weakQuality =
    s.fillerHeavy ||
    s.irritantHits >= 3 ||
    s.alcoholHigh ||
    s.fragranceHigh ||
    (s.supportive <= 2 && !s.hasPreservative);
  if (weakQuality) {
    let score = 5;
    if (s.supportive <= 1) score -= 1;
    if (s.fragranceHigh) score -= 0.5;
    if (s.alcoholHigh) score -= 0.5;
    if (s.dyeHigh || s.dyeHits >= 2) score -= 0.5;
    return {
      score: Math.max(3, roundHalf(score)),
      poorQuality: true,
      excellentQuality: false,
      strongIrritant: s.fragranceHigh || s.irritantHits >= 4,
      heavyRichFormula: s.heavyRich >= 3,
    };
  }

  let avg = 6;
  if (s.hum >= 2) avg += 0.5;
  if (s.barrier >= 1 || s.soothing >= 1) avg += 0.5;
  if (s.irritantHits >= 2) avg -= 0.5;
  if (s.hasPreservative) avg += 0.5;
  return {
    score: Math.max(5.5, Math.min(7, roundHalf(avg))),
    poorQuality: false,
    excellentQuality: false,
    strongIrritant: s.fragranceHigh || s.irritantHits >= 4,
    heavyRichFormula: s.heavyRich >= 3,
  };
}

function skinTypeAdjustment(
  text: string,
  skinTypeRaw: string
): { adj: number; mismatch: boolean; idealMatch: boolean } {
  const st = skinTypeRaw.trim().toLowerCase();
  const s = computeFormulaSignals(text);
  const hydrationBarrier = s.hum + s.barrier;
  const lightweight = countHits(text, LIGHT_CONTROL) >= 1 && s.heavyRich <= 2;
  const heavyVery = s.richCreamLoad >= 5 || highInList(splitIngredients(text), HEAVY_OILS_RICH);
  const irritant = s.fragranceHits > 0 || s.alcoholHigh || s.irritantHits >= 3;
  const soothingMinimal = s.soothing >= 1 && s.fragranceHits === 0 && s.irritantHits <= 1;

  if (!st || st === "normal") {
    const balanced = hydrationBarrier >= 2 && s.irritantHits <= 2;
    return { adj: balanced ? 0.5 : 0, mismatch: false, idealMatch: balanced };
  }
  if (st === "dry") {
    if (hydrationBarrier >= 4) return { adj: 1.5, mismatch: false, idealMatch: true };
    if (s.alcoholHigh || s.alcoholHits >= 1) return { adj: -2, mismatch: true, idealMatch: false };
    return { adj: 0, mismatch: hydrationBarrier <= 1, idealMatch: false };
  }
  if (st === "oily") {
    if (heavyVery) return { adj: -3, mismatch: true, idealMatch: false };
    if (lightweight) return { adj: 1, mismatch: false, idealMatch: true };
    return { adj: 0, mismatch: s.heavyRich >= 3, idealMatch: false };
  }
  if (st === "combination") {
    if (heavyVery || (s.alcoholHigh && hydrationBarrier <= 1)) {
      return { adj: -1.5, mismatch: true, idealMatch: false };
    }
    const balanced = hydrationBarrier >= 2 && s.irritantHits <= 2;
    return { adj: balanced ? 0.5 : 0, mismatch: false, idealMatch: balanced };
  }
  if (st === "sensitive") {
    if (irritant || hasAny(text, TEA_TREE) || hasAny(text, MENTHOL_CAMPHOR)) {
      return { adj: -3, mismatch: true, idealMatch: false };
    }
    if (soothingMinimal && s.botanicalExtractHits <= 2) {
      return { adj: 1, mismatch: false, idealMatch: true };
    }
    return { adj: 0, mismatch: false, idealMatch: false };
  }
  if (st === "acne-prone" || st === "acne prone") {
    if (heavyVery || s.fragranceHits > 0) return { adj: -3, mismatch: true, idealMatch: false };
    const nonCloggingSoothing =
      s.heavyRich <= 2 &&
      (s.soothing >= 1 || text.includes("niacinamide") || hasAny(text, ["salicylic acid", "betaine salicylate"]));
    if (nonCloggingSoothing) return { adj: 1, mismatch: false, idealMatch: true };
    return { adj: 0, mismatch: false, idealMatch: false };
  }
  return { adj: 0, mismatch: false, idealMatch: false };
}

function goalAdjustment(
  text: string,
  goals: string[]
): { adj: number; strongMatch: boolean } {
  let adj = 0;
  let strongSignals = 0;
  const canonGoals = goals
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => SKIN_GOALS_CANON.find((c) => c.toLowerCase() === g.toLowerCase()) ?? g);

  for (const g of canonGoals) {
    const gl = g.toLowerCase();
    if (gl.includes("hydration")) {
      if (countHits(text, HUMECTANTS) >= 1 || countHits(text, BARRIER) >= 1) {
        adj += 1;
        if (countHits(text, HUMECTANTS) >= 2 && countHits(text, BARRIER) >= 1) {
          strongSignals += 1;
        }
      }
    }
    if (gl === "glow") {
      if (text.includes("niacinamide") || hasAny(text, ANTIOX) || hasAny(text, EXFOL_ACIDS_STRONG)) {
        adj += 1;
        strongSignals += 1;
      }
    }
    if (gl.includes("barrier")) {
      if (
        text.includes("ceramide") ||
        text.includes("cholesterol") ||
        text.includes("panthenol") ||
        text.includes("oat")
      ) {
        adj += 1;
        if (text.includes("ceramide") || text.includes("cholesterol")) strongSignals += 1;
      }
    }
    if (gl.includes("calm") || gl.includes("redness")) {
      if (hasAny(text, SOOTHING) || hasAny(text, CENTELLA)) {
        adj += 1;
        strongSignals += 1;
      }
    }
    if (gl.includes("acne")) {
      if (
        hasAny(text, ["salicylic acid", "betaine salicylate"]) ||
        text.includes("niacinamide") ||
        (countHits(text, LIGHT_CONTROL) >= 1 && hasAny(text, SOOTHING))
      ) {
        adj += 1;
        strongSignals += 1;
      }
      if (countHits(text, HEAVY_OILS_RICH) >= 2 || text.includes("petrolatum")) adj -= 1;
    }
    if (gl.includes("anti-aging") || gl.includes("antiaging")) {
      if (hasAny(text, PEPTIDES) || hasAny(text, RETINOIDS) || hasAny(text, ANTIOX)) {
        adj += 1;
        strongSignals += 1;
      }
    }
  }

  return { adj, strongMatch: canonGoals.length > 0 && strongSignals >= Math.max(1, Math.ceil(canonGoals.length / 2)) };
}

export function computePersonalizedScore(
  ingredientsRaw: string,
  skinTypeRaw: string,
  skinGoals: string[]
): number {
  const text = normalizeText(ingredientsRaw);
  if (!text) return 1;

  const base = baseIngredientScore(text);
  const skin = skinTypeAdjustment(text, skinTypeRaw);
  const goal = goalAdjustment(text, skinGoals);
  const st = skinTypeRaw.trim().toLowerCase();
  const signals = computeFormulaSignals(text);

  let total = base.score + skin.adj + goal.adj;

  // Hard-truth caps
  if (base.poorQuality) total = Math.min(total, 6);
  if (base.strongIrritant && st === "sensitive") total = Math.min(total, 5);
  if (
    (st === "oily" || st === "acne-prone" || st === "acne prone") &&
    signals.richCreamLoad >= 4
  ) {
    total = Math.min(total, 6);
  }
  if (
    st === "sensitive" &&
    (signals.botanicalExtractHits >= 4 ||
      signals.fragranceHits >= 1 ||
      signals.dyeHits >= 1 ||
      signals.irritantHits >= 3)
  ) {
    total = Math.min(total, 7);
  }
  if (base.excellentQuality && skin.mismatch) {
    total = Math.min(total, 7);
    total = Math.max(total, 4);
  }
  if (base.excellentQuality && skin.idealMatch) {
    total = Math.max(total, 9);
  }
  const noMismatchConcerns =
    !skin.mismatch &&
    !(st === "sensitive" && signals.irritantHits >= 2) &&
    !((st === "oily" || st === "acne-prone" || st === "acne prone") && signals.richCreamLoad >= 4);

  // 10/10 requires excellent formula + strong skin match + strong goal match + no concerns
  const canBeTen =
    base.excellentQuality &&
    skin.idealMatch &&
    goal.strongMatch &&
    noMismatchConcerns;
  if (!canBeTen) total = Math.min(total, 9);

  // Final output rules
  return Math.max(1, Math.min(10, Math.round(total)));
}
