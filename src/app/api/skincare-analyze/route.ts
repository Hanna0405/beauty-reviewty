import { NextResponse } from "next/server";
import OpenAI from "openai";
import { computePersonalizedScore } from "./scoring";
import {
  chipStringArray,
  normalizeSuitabilityChips,
} from "@/lib/skincare/suitabilityChips";

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
  /** Canonical suitability chips (same values as bestFor / notIdealFor). */
  goodFor: string[];
  beCareful: string[];
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

function sanitizeFastAnalysis(
  input: unknown,
  ctx: { skinType: string; skinGoals: string[] }
): {
  summary: string;
  statusText: string;
  bestFor: string[];
  notIdealFor: string[];
  goodFor: string[];
  beCareful: string[];
  disclaimer: string;
  productType: ProductType;
  productTypeConfidence: ProductTypeConfidence;
  scoreExplanation?: ScoreExplanation;
} {
  const x = (input ?? {}) as Record<string, unknown>;
  const se = sanitizeScoreExplanation(x);
  const productType = sanitizeProductType(x.productType);
  const suitability = normalizeSuitabilityChips(x, {
    skinType: ctx.skinType,
    skinGoals: ctx.skinGoals,
    productType,
    summary: typeof x.summary === "string" ? x.summary : undefined,
    statusText: typeof x.statusText === "string" ? x.statusText : undefined,
    scoreExplanation: se,
  });

  return {
    summary:
      typeof x.summary === "string" && x.summary.trim()
        ? x.summary.trim()
        : "This ingredient list has mixed strengths and trade-offs.",
    statusText:
      typeof x.statusText === "string" && x.statusText.trim()
        ? x.statusText.trim()
        : "Balanced overview",
    bestFor: suitability.bestFor,
    notIdealFor: suitability.notIdealFor,
    goodFor: suitability.goodFor,
    beCareful: suitability.beCareful,
    disclaimer:
      typeof x.disclaimer === "string" && x.disclaimer.trim()
        ? x.disclaimer.trim()
        : "AI skincare analysis is for educational purposes only and does not replace advice from a dermatologist or qualified professional.",
    productType,
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

/** Stable default; override with OPENAI_SKINCARE_MODEL if needed */
const SKINCARE_ANALYZE_MODEL =
  process.env.OPENAI_SKINCARE_MODEL?.trim() || "gpt-4o-mini";

const DEFAULT_DISCLAIMER =
  "AI skincare analysis is for educational purposes only and does not replace advice from a dermatologist or qualified professional.";

/** Caps model output; score/label/status are set server-side. */
const ANALYZE_MAX_OUTPUT_TOKENS = 720;

const ANALYZE_JSON_KEYS =
  "summary,statusText,bestFor,notIdealFor,scoreExplanation{skinFit,goalFit,helpfulIngredients[{name,note}],cautionIngredients[{name,note}]},productType,productTypeConfidence,disclaimer";

function buildAnalyzeSystemPrompt(): string {
  return [
    "BeautyReviewty skincare assistant. Balanced, educational tone; no medical diagnosis or advice.",
    `Score is fixed server-side—align summary and statusText only. Labels: 9–10 Very good, 7–8 Good, 5–6 Okay, 0–4 Not ideal.`,
    "bestFor/notIdealFor: max 3 each, ≤28 chars, for user's skin type and goals.",
    "scoreExplanation: skinFit and goalFit one sentence each (≤220 chars); helpfulIngredients and cautionIngredients max 3 each, one-sentence notes tied to the fixed score.",
    "productType: moisturizer|serum|sunscreen|cleanser|toner|acne treatment|face oil|mask|unknown. productTypeConfidence: high|medium|low.",
    "Infer type from ingredients unless overridden. Hints: sunscreen=ZnO,TiO2,avobenzone,octocrylene,homosalate,octisalate,tinosorb,mexoryl; cleanser=SLS/SLES,cocamidopropyl betaine,glucosides,SCI; serum=humectants+actives; moisturizer=ceramides,cholesterol,fatty acids,petrolatum,shea,squalane,dimethicone; toner=watery humectants/extracts; acne=salicylic acid,BPO,sulfur,azelaic,adapalene; face oil=oils; mask=clay,kaolin,bentonite,charcoal.",
    `disclaimer: "${DEFAULT_DISCLAIMER}"`,
    "No product alternatives. JSON only.",
  ].join(" ");
}

function buildAnalyzeUserPrompt(
  ingredients: string,
  userContext: string,
  score: number,
  scoreLabel: string
): string {
  return `Fixed score ${score}/10 (${scoreLabel}). Return JSON keys: ${ANALYZE_JSON_KEYS}.

${userContext}

Ingredients:
${ingredients}`;
}

function logSkincareAnalyzeError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    const err = error as {
      message?: string;
      status?: number;
      code?: string;
      type?: string;
      param?: string;
      error?: { message?: string; code?: string; type?: string };
      cause?: unknown;
    };
    console.error(`[skincare-analyze] ${context}`, {
      message: err?.message ?? String(error),
      status: err?.status,
      code: err?.code,
      type: err?.type,
      param: err?.param,
      apiMessage: err?.error?.message,
      apiCode: err?.error?.code,
      apiType: err?.error?.type,
      cause:
        err?.cause instanceof Error
          ? err.cause.message
          : err?.cause != null
            ? String(err.cause)
            : undefined,
    });
  } else {
    console.error(
      `[skincare-analyze] ${context}`,
      error instanceof Error ? error.message : error
    );
  }
}

function buildFallbackAnalysis(
  score: number,
  skinType: string,
  skinGoals: string[],
  productType: ProductType,
  productTypeConfidence: ProductTypeConfidence
): SkincareAnalyzeResponse {
  const scoreLabel = scoreToLabel(score);
  const status = scoreToStatus(score);
  const skinHint = skinType ? ` for ${skinType} skin` : "";
  const goalsHint =
    skinGoals.length > 0
      ? ` with goals like ${skinGoals.slice(0, 2).join(" and ")}`
      : "";

  return {
    score,
    scoreLabel,
    summary: `This formula scores ${score}/10${skinHint}${goalsHint} based on ingredient fit. Full AI commentary is temporarily unavailable — the score still reflects your profile.`,
    status,
    statusText:
      score >= 7
        ? "Likely a solid match for your profile"
        : score >= 5
          ? "Mixed fit — review actives carefully"
          : "May not suit your current profile",
    bestFor: skinType
      ? [shortChip(`${skinType} skin`)]
      : chipStringArray(["Check ingredient fit"], 1),
    notIdealFor: chipStringArray(["Patch-test first"], 1),
    goodFor: skinType
      ? [shortChip(`${skinType} skin`)]
      : chipStringArray(["Check ingredient fit"], 1),
    beCareful: chipStringArray(["Patch-test first"], 1),
    productType,
    productTypeConfidence,
    scoreExplanation: {
      skinFit: skinType
        ? `Scoring weighs how these ingredients typically behave on ${skinType} skin.`
        : "Scoring weighs common ingredient behavior when skin type is not specified.",
      goalFit:
        skinGoals.length > 0
          ? `Your selected goals (${skinGoals.join(", ")}) are included in the fit score.`
          : "Add skin goals for a more tailored breakdown when the service is available.",
      helpfulIngredients: [],
      cautionIngredients: [],
    },
    disclaimer: DEFAULT_DISCLAIMER,
  };
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

    const overrideLine = forcedProductType
      ? `Type override: ${forcedProductType} (mandatory; productTypeConfidence=high).`
      : "Type override: none.";

    const userContext = [
      skinType ? `Skin: ${skinType}` : "Skin: unspecified",
      skinGoals.length ? `Goals: ${skinGoals.join(", ")}` : "Goals: none",
      overrideLine,
    ].join("\n");

    const client = new OpenAI({
      apiKey,
      timeout: 55_000,
      maxRetries: 1,
    });
    const systemPrompt = buildAnalyzeSystemPrompt();
    const userPrompt = buildAnalyzeUserPrompt(
      ingredients,
      userContext,
      personalizedScore,
      personalizedLabel
    );

    let partial: ReturnType<typeof sanitizeFastAnalysis>;
    try {
      const completion = await client.chat.completions.create({
        model: SKINCARE_ANALYZE_MODEL,
        temperature: 0.2,
        max_tokens: ANALYZE_MAX_OUTPUT_TOKENS,
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
      partial = sanitizeFastAnalysis(parsed, { skinType, skinGoals });
    } catch (openAiError) {
      logSkincareAnalyzeError(
        `OpenAI request failed (model=${SKINCARE_ANALYZE_MODEL})`,
        openAiError
      );
      const fallbackType = forcedProductType ?? "unknown";
      return NextResponse.json(
        buildFallbackAnalysis(
          personalizedScore,
          skinType,
          skinGoals,
          fallbackType,
          forcedProductType ? "high" : "low"
        )
      );
    }

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
      goodFor: partial.goodFor,
      beCareful: partial.beCareful,
      productType,
      productTypeConfidence,
      disclaimer: partial.disclaimer,
      ...(partial.scoreExplanation
        ? { scoreExplanation: partial.scoreExplanation }
        : {}),
    };

    return NextResponse.json(payload);
  } catch (error) {
    logSkincareAnalyzeError("unexpected error", error);
    return NextResponse.json(
      { error: "Unable to analyze right now. Please try again later." },
      { status: 500 }
    );
  }
}
