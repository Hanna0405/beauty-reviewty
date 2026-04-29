import { NextResponse } from "next/server";
import OpenAI from "openai";
import { computePersonalizedScore } from "./scoring";

type ScoreExplanation = {
  skinFit: string;
  goalFit: string;
  helpfulIngredients: { name: string; note: string }[];
  cautionIngredients: { name: string; note: string }[];
};

type ProductType =
  | "moisturizer"
  | "serum"
  | "sunscreen"
  | "cleanser"
  | "toner"
  | "acne treatment"
  | "face oil"
  | "mask"
  | "unknown";

type ProductTypeConfidence = "high" | "medium" | "low";

type SkincareAnalyzeResponse = {
  score: number;
  scoreLabel: "Very good" | "Good" | "Okay" | "Not ideal";
  summary: string;
  status: "good" | "okay" | "not_ideal";
  statusText: string;
  bestFor: string[];
  notIdealFor: string[];
  productType: ProductType;
  productTypeConfidence: ProductTypeConfidence;
  scoreExplanation?: ScoreExplanation;
  disclaimer: string;
};

function scoreToLabel(n: number): SkincareAnalyzeResponse["scoreLabel"] {
  if (n >= 9) return "Very good";
  if (n >= 7) return "Good";
  if (n >= 5) return "Okay";
  return "Not ideal";
}

function scoreToStatus(n: number): SkincareAnalyzeResponse["status"] {
  if (n >= 7) return "good";
  if (n >= 5) return "okay";
  return "not_ideal";
}

const CHIP_MAX_LEN = 28;

function shortChip(s: string): string {
  const t = s.trim();
  if (t.length <= CHIP_MAX_LEN) return t;
  return `${t.slice(0, CHIP_MAX_LEN - 1)}…`;
}

function chipStringArray(v: unknown, maxItems: number): string[] {
  return (Array.isArray(v) ? v : [])
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => shortChip(s));
}

const NOTE_MAX = 160;
const FIT_LINE_MAX = 220;

function oneSentence(s: string, maxLen: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0]?.trim() ?? t;
  if (cut.length <= maxLen) return cut;
  return `${cut.slice(0, maxLen - 1)}…`;
}

function parseNameNotePairs(
  v: unknown,
  maxItems: number
): { name: string; note: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as { name?: unknown; note?: unknown };
      if (typeof rec.name !== "string" || typeof rec.note !== "string") {
        return null;
      }
      const name = rec.name.trim();
      const note = oneSentence(rec.note, NOTE_MAX);
      if (!name && !note) return null;
      return {
        name: name || "Ingredient",
        note: note || "—",
      };
    })
    .filter((v): v is { name: string; note: string } => Boolean(v))
    .slice(0, maxItems);
}

const PRODUCT_TYPES = new Set<string>([
  "moisturizer",
  "serum",
  "sunscreen",
  "cleanser",
  "toner",
  "acne treatment",
  "face oil",
  "mask",
  "unknown",
]);

function sanitizeProductType(raw: unknown): ProductType {
  if (typeof raw !== "string") return "unknown";
  const t = raw.trim().toLowerCase();
  if (t === "face-oil") return "face oil";
  if (t === "acne-treatment" || t === "acne_treatment") return "acne treatment";
  if (PRODUCT_TYPES.has(t)) return t as ProductType;
  return "unknown";
}

function sanitizeProductTypeConfidence(raw: unknown): ProductTypeConfidence {
  if (raw === "high" || raw === "medium" || raw === "low") return raw;
  return "low";
}

function sanitizeScoreExplanation(
  x: Record<string, unknown>
): ScoreExplanation | undefined {
  const raw = x.scoreExplanation;
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const skinFit =
    typeof o.skinFit === "string" ? oneSentence(o.skinFit, FIT_LINE_MAX) : "";
  const goalFit =
    typeof o.goalFit === "string" ? oneSentence(o.goalFit, FIT_LINE_MAX) : "";
  const helpfulIngredients = parseNameNotePairs(o.helpfulIngredients, 3);
  const cautionIngredients = parseNameNotePairs(o.cautionIngredients, 3);
  if (
    !skinFit &&
    !goalFit &&
    helpfulIngredients.length === 0 &&
    cautionIngredients.length === 0
  ) {
    return undefined;
  }
  return {
    skinFit: skinFit || "Skin fit is based on your selected type and this formula.",
    goalFit:
      goalFit ||
      "Goal fit reflects how well the ingredients support what you picked.",
    helpfulIngredients,
    cautionIngredients,
  };
}

function parseProductTypeOverride(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const v = (body as Record<string, unknown>).productTypeOverride;
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function productTypeFromUserOverride(raw: string): ProductType | null {
  const r = raw.trim().toLowerCase();
  if (!r || r === "auto") return null;
  const map: Record<string, ProductType> = {
    serum: "serum",
    cream: "moisturizer",
    moisturizer: "moisturizer",
    spf: "sunscreen",
    sunscreen: "sunscreen",
    cleanser: "cleanser",
    toner: "toner",
  };
  return map[r] ?? null;
}

function sanitizeFastAnalysis(input: unknown): {
  summary: string;
  statusText: string;
  bestFor: string[];
  notIdealFor: string[];
  disclaimer: string;
  productType: ProductType;
  productTypeConfidence: ProductTypeConfidence;
  scoreExplanation?: ScoreExplanation;
} {
  const x = (input ?? {}) as Record<string, unknown>;
  const se = sanitizeScoreExplanation(x);
  return {
    summary:
      typeof x.summary === "string" && x.summary.trim()
        ? x.summary.trim()
        : "This ingredient list has mixed strengths and trade-offs.",
    statusText:
      typeof x.statusText === "string" && x.statusText.trim()
        ? x.statusText.trim()
        : "Balanced overview",
    bestFor: chipStringArray(x.bestFor, 3),
    notIdealFor: chipStringArray(x.notIdealFor, 3),
    disclaimer:
      typeof x.disclaimer === "string" && x.disclaimer.trim()
        ? x.disclaimer.trim()
        : "AI skincare analysis is for educational purposes only and does not replace advice from a dermatologist or qualified professional.",
    productType: sanitizeProductType(x.productType),
    productTypeConfidence: sanitizeProductTypeConfidence(
      x.productTypeConfidence
    ),
    ...(se ? { scoreExplanation: se } : {}),
  };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }

  throw new Error("No JSON object in model output");
}

function parseBodySkinGoals(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ingredients =
      typeof body?.ingredients === "string" ? body.ingredients.trim() : "";
    const skinType =
      typeof body?.skinType === "string" ? body.skinType.trim() : "";
    const skinGoals = parseBodySkinGoals(body?.skinGoals);
    const overrideRaw = parseProductTypeOverride(body);
    const forcedProductType = productTypeFromUserOverride(overrideRaw);

    if (!ingredients) {
      return NextResponse.json(
        { error: "Ingredients are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[skincare-analyze] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Unable to analyze right now. Please try again later." },
        { status: 500 }
      );
    }

    const personalizedScore = computePersonalizedScore(
      ingredients,
      skinType,
      skinGoals
    );
    const personalizedLabel = scoreToLabel(personalizedScore);
    const personalizedStatus = scoreToStatus(personalizedScore);

    const overrideLine = forcedProductType
      ? `Product type OVERRIDE (mandatory — use exactly this type for productType and messaging): ${forcedProductType}. Set productTypeConfidence to "high".`
      : "Product type override: none (infer productType from ingredients only).";

    const userContext = [
      skinType ? `User's selected skin type: ${skinType}` : "Skin type: not specified",
      skinGoals.length
        ? `User's skin goals: ${skinGoals.join(", ")}`
        : "Skin goals: not specified",
      overrideLine,
    ].join("\n");

    const client = new OpenAI({ apiKey });
    const systemPrompt = [
      "You are a skincare ingredient assistant for BeautyReviewty. Analyze ingredients in a balanced, non-alarming way.",
      "Do not diagnose medical conditions. Do not give medical advice. Use action-based, educational beauty language.",
      "The server already computed the personalized 0–10 fit score from ingredients + selected skin type + goals. You MUST NOT invent a different score. Align summary and statusText with that score.",
      "scoreLabel MUST match the numeric score: 9–10 Very good, 7–8 Good, 5–6 Okay, 0–4 Not ideal.",
      "\"Is it right for you?\" chips: bestFor = who benefits from this formula for the user's selected skin type and goals; notIdealFor = who should be cautious for THIS profile.",
      "bestFor and notIdealFor: max 3 each, max 28 characters each.",
      "Include scoreExplanation: skinFit and goalFit = one short sentence each (max ~220 chars); helpfulIngredients and cautionIngredients max 3 each, each note ONE sentence only, tied to the fixed score.",
      "Product type: Infer from ingredients (unless override in context). productType must be exactly one of: moisturizer, serum, sunscreen, cleanser, toner, acne treatment, face oil, mask, unknown. productTypeConfidence: high | medium | low — use low or unknown when unclear.",
      "Detection hints: sunscreen → zinc oxide, titanium dioxide, avobenzone, octocrylene, homosalate, octisalate, tinosorb, uvinul, mexoryl; cleanser → SLS, SLES, cocamidopropyl betaine, decyl glucoside, coco-glucoside, sodium cocoyl isethionate; serum → humectants + actives, few heavy occlusives; moisturizer → ceramides, cholesterol, fatty acids, petrolatum, shea, squalane, dimethicone, rich oils; toner → watery, humectants/extracts, no strong surfactants, no UV filters; acne treatment → salicylic acid, betaine salicylate, benzoyl peroxide, sulfur, azelaic acid, adapalene; face oil → mostly oils; mask → clay, kaolin, bentonite, charcoal, wash-off clues.",
      "Do NOT suggest product alternatives in this response. Alternatives are generated in a separate step.",
      "Return valid JSON only, no markdown.",
    ].join(" ");

    const userPrompt = `Analyze these ingredients for the Context below. The personalized fit score is ALREADY FIXED by the app.

REQUIRED (copy exactly for reference in your reasoning; the server will set final score fields):
- score: ${personalizedScore}
- scoreLabel: "${personalizedLabel}"
- status: "${personalizedStatus}"

Return ONLY valid JSON with this shape (no extra keys):
{
  "summary": "one short paragraph: tie to selected skin type, goals, and the score",
  "statusText": "short personalized label for THIS skin type/goals",
  "bestFor": ["max 3, under 28 chars"],
  "notIdealFor": ["max 3, under 28 chars"],
  "scoreExplanation": {
    "skinFit": "one sentence for selected skin type",
    "goalFit": "one sentence for selected goals",
    "helpfulIngredients": [ { "name": "ingredient", "note": "one sentence" } ],
    "cautionIngredients": [ { "name": "ingredient", "note": "one sentence" } ]
  },
  "productType": "sunscreen",
  "productTypeConfidence": "high",
  "disclaimer": "AI skincare analysis is for educational purposes only and does not replace advice from a dermatologist or qualified professional."
}

Context:
${userContext}

Ingredients:
${ingredients}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty model response");
    }

    const parsed = extractJsonObject(content) as Record<string, unknown>;
    const partial = sanitizeFastAnalysis(parsed);
    let productType = partial.productType;
    let productTypeConfidence = partial.productTypeConfidence;
    if (forcedProductType) {
      productType = forcedProductType;
      productTypeConfidence = "high";
    }

    const score = personalizedScore;
    const scoreLabel = scoreToLabel(score);
    const status = scoreToStatus(score);

    const payload: SkincareAnalyzeResponse = {
      score,
      scoreLabel,
      summary: partial.summary,
      status,
      statusText: partial.statusText,
      bestFor: partial.bestFor,
      notIdealFor: partial.notIdealFor,
      productType,
      productTypeConfidence,
      disclaimer: partial.disclaimer,
      ...(partial.scoreExplanation
        ? { scoreExplanation: partial.scoreExplanation }
        : {}),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[skincare-analyze] error", error);
    return NextResponse.json(
      { error: "Unable to analyze right now. Please try again later." },
      { status: 500 }
    );
  }
}
