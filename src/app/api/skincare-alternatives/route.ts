import { NextResponse } from "next/server";
import OpenAI from "openai";

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

type AlternativePick = {
  label: string;
  productName: string;
  reason: string;
  priceTier: "budget" | "mid-range" | "premium";
  imageUrl: string;
  productUrl: string;
};

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

function parseProductTypeOverride(body: Record<string, unknown>): string {
  const v = body.productTypeOverride;
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

function parseBodySkinGoals(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}

function clampScore(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 5;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function parseScore(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return clampScore(v);
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    return clampScore(x);
  }
  return 5;
}

const ALT_LABEL_MAX = 40;
const ALT_NAME_MAX = 80;
const ALT_REASON_MAX = 140;
const ALT_URL_MAX = 500;

function oneSentence(s: string, maxLen: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0]?.trim() ?? t;
  if (cut.length <= maxLen) return cut;
  return `${cut.slice(0, maxLen - 1)}…`;
}

function sanitizeUrl(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) return "";
  return t.slice(0, max);
}

function sanitizeAlternatives(raw: unknown, maxItems: number): AlternativePick[] {
  if (!Array.isArray(raw)) return [];
  const out: AlternativePick[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label =
      typeof o.label === "string" ? o.label.trim().slice(0, ALT_LABEL_MAX) : "";
    const productName =
      typeof o.productName === "string"
        ? o.productName.trim().slice(0, ALT_NAME_MAX)
        : "";
    const reason =
      typeof o.reason === "string"
        ? oneSentence(o.reason, ALT_REASON_MAX)
        : "";
    const pt = o.priceTier;
    const priceTier =
      pt === "budget" || pt === "mid-range" || pt === "premium"
        ? pt
        : "mid-range";
    if (!productName) continue;
    out.push({
      label: label || "Pick",
      productName,
      reason: reason || "Fits your profile and product type.",
      priceTier,
      imageUrl: sanitizeUrl(o.imageUrl, ALT_URL_MAX),
      productUrl: sanitizeUrl(o.productUrl, ALT_URL_MAX),
    });
    if (out.length >= maxItems) break;
  }
  return out;
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

type SkincareAlternativesResponse = {
  alternatives: AlternativePick[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const ingredients =
      typeof body.ingredients === "string" ? body.ingredients.trim() : "";
    const skinType =
      typeof body.skinType === "string" ? body.skinType.trim() : "";
    const skinGoals = parseBodySkinGoals(body.skinGoals);
    const score = parseScore(body.score);
    const forced = productTypeFromUserOverride(parseProductTypeOverride(body));
    let productType = sanitizeProductType(body.productType);
    if (forced) {
      productType = forced;
    }

    if (!ingredients) {
      return NextResponse.json(
        { error: "Ingredients are required." },
        { status: 400 }
      );
    }

    if (productType === "unknown") {
      return NextResponse.json({ alternatives: [] });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[skincare-alternatives] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Unable to load alternatives right now." },
        { status: 500 }
      );
    }

    const userContext = [
      `Product type (mandatory for all suggestions): ${productType}`,
      `Personalized fit score (0–10): ${score}`,
      skinType ? `User skin type: ${skinType}` : "Skin type: not specified",
      skinGoals.length
        ? `User skin goals: ${skinGoals.join(", ")}`
        : "Skin goals: not specified",
    ].join("\n");

    const client = new OpenAI({ apiKey });
    const systemPrompt = [
      "You suggest real-world skincare product alternatives for BeautyReviewty. Educational only; no medical claims.",
      "Every alternative MUST match the given product type exactly (e.g. only sunscreens for sunscreen). Never cross types.",
      "Return 2–4 alternatives tailored to skin type, goals, and score (e.g. lower score → gentler or more targeted picks).",
      "Each item: label (e.g. Better for your skin), productName (recognizable product), reason (one short sentence), priceTier: budget | mid-range | premium.",
      "imageUrl: optional HTTPS URL to a product image if you are highly confident; otherwise use empty string.",
      "productUrl: optional HTTPS shopping or brand page if confident; otherwise empty string.",
      "Return valid JSON only, no markdown.",
    ].join(" ");

    const userPrompt = `Suggest alternatives for this ingredient list and profile.

${userContext}

Ingredients:
${ingredients}

Return ONLY valid JSON:
{
  "alternatives": [
    {
      "label": "Better for your skin",
      "productName": "Product name",
      "reason": "One short sentence.",
      "priceTier": "mid-range",
      "imageUrl": "",
      "productUrl": ""
    }
  ]
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
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
    const alternatives = sanitizeAlternatives(parsed.alternatives, 4);

    const payload: SkincareAlternativesResponse = { alternatives };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[skincare-alternatives] error", error);
    return NextResponse.json(
      { error: "Unable to load alternatives right now." },
      { status: 500 }
    );
  }
}
