"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, memo, useEffect, useMemo, useRef, useState } from "react";

const SKIN_TYPES = [
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
  "Acne-prone",
  "Normal",
] as const;

const SKIN_GOAL_OPTIONS = [
  "Hydration",
  "Glow",
  "Anti-aging",
  "Calm redness",
  "Barrier repair",
  "Acne support",
] as const;

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

type AlternativePick = {
  label: string;
  productName: string;
  brand?: string;
  reason: string;
  priceTier: "budget" | "mid-range" | "premium";
  imageUrl?: string;
  productUrl?: string;
};

/** Matches POST /api/skincare-analyze (fast path). Optional fields support demo fallbacks. */
type AnalysisResult = {
  score: number;
  scoreLabel: "Very good" | "Good" | "Okay" | "Not ideal";
  summary: string;
  status: "good" | "okay" | "not_ideal";
  statusText: string;
  bestFor: string[];
  notIdealFor: string[];
  disclaimer: string;
  productType?: ProductType;
  productTypeConfidence?: ProductTypeConfidence;
  scoreExplanation?: ScoreExplanation;
  why?: string[];
  ingredientsToNotice?: { name: string; note: string }[];
};

const demoResult: AnalysisResult = {
  status: "not_ideal",
  statusText: "Not ideal for sensitive skin",
  summary: "This formula may feel too harsh for easily irritated skin.",
  score: 4,
  scoreLabel: "Not ideal",
  why: [
    "Contains fragrance - may irritate sensitive skin",
    "Alcohol denat can feel drying for some skin types",
    "Not enough soothing ingredients",
  ],
  bestFor: ["Normal to combination skin", "Humid climates"],
  notIdealFor: ["Sensitive skin", "Very dry skin"],
  ingredientsToNotice: [
    { name: "Fragrance", note: "Can trigger irritation in reactive skin." },
    { name: "Alcohol Denat", note: "May feel lightweight but can be drying." },
  ],
  scoreExplanation: {
    skinFit:
      "For sensitive skin, this mix leans irritating because of fragrance and drying alcohol.",
    goalFit:
      "If you want calm, even-toned skin, these picks work against that goal more than they help.",
    helpfulIngredients: [
      { name: "Humectants (if any)", note: "May still offer some lightweight hydration." },
    ],
    cautionIngredients: [
      { name: "Fragrance", note: "Common trigger for redness and stinging on reactive skin." },
      { name: "Alcohol Denat", note: "Can feel stripping and worsen dryness or irritation." },
    ],
  },
  disclaimer:
    "AI skincare analysis is for educational purposes only and does not replace advice from a dermatologist or qualified professional.",
  productType: "sunscreen",
  productTypeConfidence: "high",
};

const STATIC_FALLBACK_ALTERNATIVES: AlternativePick[] = [
  {
    label: "Safer option",
    productName: "COSRX Aloe Soothing Sun Cream SPF 50",
    reason: "Example pick for easily irritated skin (demo).",
    priceTier: "mid-range",
  },
  {
    label: "Budget option",
    productName: "CeraVe Hydrating Mineral Sunscreen SPF 30",
    reason: "Example mineral SPF (demo).",
    priceTier: "budget",
  },
];

const PRODUCT_TYPE_OVERRIDE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "serum", label: "Serum" },
  { value: "moisturizer", label: "Cream" },
  { value: "sunscreen", label: "SPF" },
  { value: "cleanser", label: "Cleanser" },
  { value: "toner", label: "Toner" },
] as const;

function formatProductTypeLabel(t: string | undefined): string {
  if (!t || t === "unknown") return "unknown";
  return t
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function priceTierChipClass(tier: AlternativePick["priceTier"]): string {
  if (tier === "budget") {
    return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/70";
  }
  if (tier === "premium") {
    return "bg-violet-100 text-violet-900 ring-1 ring-violet-200/70";
  }
  return "bg-amber-100 text-amber-950 ring-1 ring-amber-200/70";
}

function scoreToLabel(n: number): NonNullable<AnalysisResult["scoreLabel"]> {
  if (n >= 9) return "Very good";
  if (n >= 7) return "Good";
  if (n >= 5) return "Okay";
  return "Not ideal";
}

function statusFallbackScore(s: AnalysisResult["status"]): number {
  if (s === "good") return 8;
  if (s === "okay") return 6;
  return 4;
}

function normalizeStatus(s: unknown): AnalysisResult["status"] {
  if (s === "good" || s === "okay" || s === "not_ideal") return s;
  return "okay";
}

/** Result card colors by numeric score: 8–10 green, 5–7 yellow, 0–4 red/pink */
function scoreBlockStylesByNumber(score: number): string {
  const n = Math.max(0, Math.min(10, Math.round(score)));
  if (n >= 8) {
    return "bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-200/70";
  }
  if (n >= 5) {
    return "bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-200/80";
  }
  return "bg-rose-50 text-rose-900 shadow-sm ring-1 ring-rose-200/90";
}

function displayScore(
  r: AnalysisResult
): { score: number; label: NonNullable<AnalysisResult["scoreLabel"]> } {
  const st = normalizeStatus(r.status);
  if (typeof r.score === "number" && !Number.isNaN(r.score)) {
    const n = Math.max(0, Math.min(10, Math.round(r.score)));
    return { score: n, label: scoreToLabel(n) };
  }
  const n = statusFallbackScore(st);
  return { score: n, label: scoreToLabel(n) };
}

function shortLabel(result: AnalysisResult): string {
  const st = (result.statusText || "").trim();
  const su = (result.summary || "").trim();
  if (st && st.length <= 64) return st;
  if (st) return `${st.slice(0, 61)}…`;
  if (su) {
    const first = (su.split(/[.!?\n]/)[0] || su).trim();
    if (first.length <= 64) return first;
    return `${first.slice(0, 61)}…`;
  }
  return "Your formula";
}

function truncateText(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function firstSentence(s: string, maxLen: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const one = (t.split(/(?<=[.!?])\s+/)[0] ?? t).trim();
  return truncateText(one, maxLen);
}

const OCR_UNREADABLE_MESSAGE =
  "We couldn’t clearly read ingredients. Try brighter lighting, closer photo, or crop ingredient list only.";
const OCR_SUCCESS_MESSAGE = "Ingredients detected. Please review before checking.";
const OCR_MAX_DIMENSION = 1600;
const OCR_JPEG_QUALITY = 0.78;

function hasUsableScoreExplanation(
  exp: ScoreExplanation | undefined
): exp is ScoreExplanation {
  if (!exp) return false;
  const h = exp.helpfulIngredients?.length ?? 0;
  const c = exp.cautionIngredients?.length ?? 0;
  return Boolean(
    (exp.skinFit && exp.skinFit.trim()) ||
      (exp.goalFit && exp.goalFit.trim()) ||
      h > 0 ||
      c > 0
  );
}

function buildScoreExplanationView(
  r: AnalysisResult,
  lastScored: { skinType: string; skinGoals: string[] } | null
): ScoreExplanation {
  const exp = r.scoreExplanation;
  if (hasUsableScoreExplanation(exp)) {
    return {
      skinFit: exp.skinFit.trim(),
      goalFit: exp.goalFit.trim(),
      helpfulIngredients: (exp.helpfulIngredients ?? [])
        .filter((x) => x && (x.name || x.note))
        .slice(0, 3)
        .map((x) => ({
          name: String(x.name || "—").trim() || "—",
          note: truncateText(String(x.note || ""), 160),
        })),
      cautionIngredients: (exp.cautionIngredients ?? [])
        .filter((x) => x && (x.name || x.note))
        .slice(0, 3)
        .map((x) => ({
          name: String(x.name || "—").trim() || "—",
          note: truncateText(String(x.note || ""), 160),
        })),
    };
  }

  const st = (lastScored?.skinType ?? "").trim() || "your skin type";
  const goals = (lastScored?.skinGoals ?? []).filter(Boolean);
  const goalsLine = goals.length
    ? `Your selected goals: ${goals.join(", ")}.`
    : "No specific goals were selected.";

  const skinFit =
    firstSentence(r.summary || r.statusText || "", 220) ||
    `This score reflects how the formula lines up with ${st}.`;
  const goalDetail =
    (r.why && r.why[0] ? firstSentence(r.why[0], 180) : "") ||
    firstSentence(r.summary || "", 180) ||
    "See the summary above for how goals line up with this list.";
  const goalFit = truncateText(`${goalsLine} ${goalDetail}`.trim(), 240);

  const fallbackNotes = (r.ingredientsToNotice ?? [])
    .filter((i) => i && (i.name || i.note))
    .slice(0, 3)
    .map((i) => ({
      name: String(i.name || "Ingredient").trim() || "Ingredient",
      note: truncateText(String(i.note || "—"), 160),
    }));

  return {
    skinFit,
    goalFit,
    helpfulIngredients: [],
    cautionIngredients: fallbackNotes,
  };
}

const chipShared =
  "inline-flex min-h-0 min-w-0 max-w-full items-center justify-center gap-0.5 rounded-full text-left text-[13px] font-medium leading-tight antialiased transition-all duration-150 ease-in-out will-change-transform active:scale-[0.97]";

const chipUnselected = `${chipShared} border border-[rgba(236,72,153,0.18)] bg-white/75 px-[11px] py-[6px] text-[#3b2f35] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-[rgba(236,72,153,0.25)] hover:bg-white/90`;

const chipSelected = `${chipShared} border-0 bg-[linear-gradient(135deg,#ec4899,#db2777)] px-[11px] py-[6px] text-white shadow-[0_4px_10px_rgba(219,39,119,0.22)] hover:brightness-[1.02]`;

const chipRowClass =
  "flex min-w-0 max-w-full flex-wrap content-start gap-[6px]";

const ALT_SKELETON_INDICES = [0, 1, 2, 3, 4, 5] as const;

const SKIN_TYPE_EMOJI: Partial<Record<(typeof SKIN_TYPES)[number], string>> = {
  Dry: "💧",
  Oily: "🧴",
  Sensitive: "🌿",
};

const SKIN_GOAL_EMOJI: Partial<Record<(typeof SKIN_GOAL_OPTIONS)[number], string>> = {
  Hydration: "💦",
  Glow: "✨",
  "Anti-aging": "⏳",
};

const AlternativeCard = memo(function AlternativeCard({ alt }: { alt: AlternativePick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(alt.imageUrl?.trim()) && !imgFailed;
  const brand = (alt.brand ?? "").trim();
  const fallbackBrand = truncateText(brand || "SKINCARE", 36);

  useEffect(() => {
    setImgFailed(false);
  }, [alt.imageUrl]);

  return (
    <article
      className="w-[150px] min-w-[140px] max-w-[160px] shrink-0 overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-rose-100/60"
    >
      <div className="relative flex h-[100px] min-h-[100px] w-full max-h-[120px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-rose-100/95 to-rose-50/90">
        {showImg ? (
          <img
            src={alt.imageUrl}
            alt=""
            className="h-full min-h-[100px] w-full min-w-0 object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex min-h-[100px] flex-col items-center justify-center gap-1.5 bg-pink-100 px-2 text-center"
            role="img"
            aria-label={
              brand
                ? `${brand} — skincare product`
                : "Skincare product placeholder"
            }
          >
            <span className="line-clamp-2 w-full shrink-0 text-center text-[11px] font-semibold leading-tight text-rose-900/90">
              {fallbackBrand}
            </span>
            <span className="select-none text-[9px] font-bold tracking-[0.22em] text-rose-500/85">
              SKINCARE
            </span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-rose-500 line-clamp-1">
        {truncateText(alt.label, 36)}
      </p>
      {brand ? (
        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-rose-500/90">
          {truncateText(brand, 32)}
        </p>
      ) : null}
      <h4 className="mt-0.5 line-clamp-2 min-h-[2.25rem] break-words text-[12px] font-semibold leading-tight text-rose-900">
        {truncateText(alt.productName, 72)}
      </h4>
      <p className="mt-0.5 line-clamp-2 break-words text-[10px] leading-snug text-rose-600">
        {truncateText(alt.reason, 100)}
      </p>
      <span
        className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${priceTierChipClass(alt.priceTier)}`}
      >
        {alt.priceTier}
      </span>
      {alt.productUrl?.trim() ? (
        <a
          href={alt.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center rounded-md border border-rose-200/60 bg-rose-50/50 py-1.5 text-center text-[11px] font-semibold text-rose-800 shadow-sm hover:bg-rose-100/80"
        >
          View
        </a>
      ) : (
        <button
          type="button"
          className="mt-2 w-full rounded-md border border-rose-200/60 bg-rose-50/50 py-1.5 text-center text-[11px] font-semibold text-rose-800 shadow-sm"
        >
          View
        </button>
      )}
    </article>
  );
});

function AlternativeCardSkeleton() {
  return (
    <article
      className="w-[150px] min-w-[140px] max-w-[160px] shrink-0 overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-rose-100/60"
      aria-hidden
    >
      <div className="h-[100px] w-full animate-pulse rounded-lg bg-rose-100/80" />
      <div className="mt-2 h-2 w-16 animate-pulse rounded bg-rose-100/90" />
      <div className="mt-2 h-2.5 w-full animate-pulse rounded bg-rose-50/95" />
      <div className="mt-1.5 h-2.5 w-[85%] animate-pulse rounded bg-rose-50/95" />
      <div className="mt-2 h-6 w-14 animate-pulse rounded-full bg-rose-100/85" />
      <div className="mt-2 h-8 w-full animate-pulse rounded-md bg-rose-50/90" />
    </article>
  );
}

function ChipLabel({
  emoji,
  text,
}: {
  emoji?: string;
  text: string;
}) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-baseline gap-0.5">
      {emoji ? (
        <span
          className="shrink-0 text-[0.65rem] leading-none opacity-70"
          aria-hidden
        >
          {emoji}
        </span>
      ) : null}
      <span className="min-w-0 leading-tight text-inherit">{text}</span>
    </span>
  );
}

export default function SkincareCheckerPage() {
  const [ingredients, setIngredients] = useState("");
  const [skinType, setSkinType] = useState<string | null>(null);
  const [skinGoals, setSkinGoals] = useState<string[]>([]);
  const [showSkinGoals, setShowSkinGoals] = useState(false);
  const [lastScoredFor, setLastScoredFor] = useState<{
    skinType: string;
    skinGoals: string[];
    productTypeOverride: string;
  } | null>(null);
  const [productTypeOverride, setProductTypeOverride] = useState("auto");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [alternativesError, setAlternativesError] = useState(false);
  const [alternativesItems, setAlternativesItems] = useState<
    AlternativePick[] | null
  >(null);
  const [whyScoreOpen, setWhyScoreOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showPhotoChoice, setShowPhotoChoice] = useState(false);
  const [ocrNotice, setOcrNotice] = useState("");
  const [ocrErrorText, setOcrErrorText] = useState("");
  /** UI-only; product type overrides stay in state when collapsed */
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const resultCardRef = useRef<HTMLElement | null>(null);
  const hasAutoScrolledToResultRef = useRef(false);
  const ocrInFlightRef = useRef(false);
  const analyzeInFlightRef = useRef(false);

  const shownResult = useMemo(() => analysis ?? demoResult, [analysis]);
  const { score: outOfTen, label: bandLabel } = useMemo(
    () => displayScore(shownResult),
    [shownResult]
  );
  const labelLine = useMemo(() => shortLabel(shownResult), [shownResult]);

  const bestForItems = (shownResult.bestFor ?? [])
    .filter((x) => Boolean(x && String(x).trim()))
    .slice(0, 3)
    .map((x) => truncateText(String(x), 28));
  const notIdealItems = (shownResult.notIdealFor ?? [])
    .filter((x) => Boolean(x && String(x).trim()))
    .slice(0, 3)
    .map((x) => truncateText(String(x), 28));

  const scoreExplanationView = useMemo(
    () => buildScoreExplanationView(shownResult, lastScoredFor),
    [shownResult, lastScoredFor]
  );

  useEffect(() => {
    if (!whyScoreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhyScoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [whyScoreOpen]);

  const selectionChangedSinceScore = useMemo(() => {
    if (!analysis || !lastScoredFor) return false;
    const typeOk = (skinType ?? "") === lastScoredFor.skinType;
    const a = [...skinGoals].sort().join("\u0000");
    const b = [...lastScoredFor.skinGoals].sort().join("\u0000");
    const overrideOk = productTypeOverride === lastScoredFor.productTypeOverride;
    return !typeOk || a !== b || !overrideOk;
  }, [analysis, lastScoredFor, skinType, skinGoals, productTypeOverride]);

  const alternativesSection = useMemo(() => {
    if (!analysis) {
      return {
        detectedLine: null as string | null,
        confidenceNote: null as string | null,
        emptyHint: null as string | null,
        items: STATIC_FALLBACK_ALTERNATIVES,
        loading: false,
        error: false,
        isDemo: true,
      };
    }
    const pt = analysis.productType ?? "unknown";
    const conf = analysis.productTypeConfidence ?? "low";
    const detectedLine = `Detected: ${formatProductTypeLabel(pt)}`;
    const lowNote =
      "Not sure what this product is. Add product name or choose product type.";

    if (alternativesError) {
      return {
        detectedLine,
        confidenceNote: conf === "low" ? lowNote : null,
        emptyHint: null as string | null,
        items: [] as AlternativePick[],
        loading: false,
        error: true,
        isDemo: false,
      };
    }
    if (alternativesLoading) {
      return {
        detectedLine,
        confidenceNote: conf === "low" ? lowNote : null,
        emptyHint: null as string | null,
        items: [] as AlternativePick[],
        loading: true,
        error: false,
        isDemo: false,
      };
    }
    if (pt === "unknown") {
      return {
        detectedLine,
        confidenceNote: null as string | null,
        emptyHint:
          "Add product name or choose product type to get better alternatives.",
        items: [] as AlternativePick[],
        loading: false,
        error: false,
        isDemo: false,
      };
    }

    const items = (alternativesItems ?? []).filter(
      (x) => x && String(x.productName || "").trim()
    );
    if (conf === "low") {
      return {
        detectedLine,
        confidenceNote: lowNote,
        emptyHint:
          items.length === 0
            ? "No alternative suggestions returned for this run."
            : null,
        items,
        loading: false,
        error: false,
        isDemo: false,
      };
    }
    return {
      detectedLine,
      confidenceNote: null as string | null,
      emptyHint:
        items.length === 0
          ? "No alternative suggestions returned for this run."
          : null,
      items,
      loading: false,
      error: false,
      isDemo: false,
    };
  }, [analysis, alternativesLoading, alternativesError, alternativesItems]);

  const scoreForLine = useMemo(() => {
    if (!lastScoredFor) {
      return null;
    }
    const st = lastScoredFor.skinType.trim() || "Not set";
    const g = lastScoredFor.skinGoals.filter(Boolean);
    const goals = g.length ? g.join(", ") : "No skin goals";
    return `Score for: ${st} + ${goals}`;
  }, [lastScoredFor]);

  useEffect(() => {
    if (!shareNotice) return;
    const t = window.setTimeout(() => setShareNotice(""), 1800);
    return () => window.clearTimeout(t);
  }, [shareNotice]);

  useEffect(() => {
    if (!analysis || hasAutoScrolledToResultRef.current) return;
    resultCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    hasAutoScrolledToResultRef.current = true;
  }, [analysis]);

  function toggleSkinType(value: (typeof SKIN_TYPES)[number]) {
    setSkinType((cur) => (cur === value ? null : value));
  }

  function toggleGoal(g: (typeof SKIN_GOAL_OPTIONS)[number]) {
    setSkinGoals((cur) =>
      cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]
    );
  }

  function handleTakePhotoClick() {
    if (ocrLoading) return;
    setShowPhotoChoice(true);
  }

  function openCameraInput() {
    setShowPhotoChoice(false);
    cameraInputRef.current?.click();
  }

  function openGalleryInput() {
    setShowPhotoChoice(false);
    galleryInputRef.current?.click();
  }

  async function optimizeImageForOcr(file: File): Promise<File | Blob> {
    const canProcess =
      typeof window !== "undefined" &&
      typeof window.createImageBitmap === "function" &&
      typeof document !== "undefined";
    if (!canProcess || !file.type.startsWith("image/")) return file;

    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = Math.max(bitmap.width, bitmap.height);
      const scale = maxSide > OCR_MAX_DIMENSION ? OCR_MAX_DIMENSION / maxSide : 1;
      const outW = Math.max(1, Math.round(bitmap.width * scale));
      const outH = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, outW, outH);
      bitmap.close();

      const outputType =
        file.type === "image/png" && scale === 1 ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputType, OCR_JPEG_QUALITY);
      });
      if (!blob) return file;
      return blob;
    } catch {
      return file;
    }
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || ocrInFlightRef.current) return;

    setOcrLoading(true);
    setOcrErrorText("");
    setOcrNotice("");
    ocrInFlightRef.current = true;

    try {
      const optimized = await optimizeImageForOcr(file);
      const formData = new FormData();
      formData.append("image", optimized, file.name);

      const res = await fetch("/api/skincare-ocr", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ingredients?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "OCR failed");
      }
      const extracted = String(data.ingredients || "").trim();
      if (!extracted || extracted === "UNREADABLE") {
        setIngredients("");
        setOcrErrorText(OCR_UNREADABLE_MESSAGE);
        return;
      }
      setIngredients(extracted);
      setErrorText("");
      setOcrErrorText("");
      setOcrNotice(OCR_SUCCESS_MESSAGE);
    } catch {
      setOcrErrorText(OCR_UNREADABLE_MESSAGE);
    } finally {
      setOcrLoading(false);
      ocrInFlightRef.current = false;
    }
  }

  async function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (analyzeInFlightRef.current) return;

    const cleaned = ingredients.trim();
    if (!cleaned) {
      setErrorText("Please paste ingredients before checking.");
      return;
    }

    setErrorText("");
    setAlternativesError(false);
    setAlternativesItems(null);
    setAlternativesLoading(false);
    setIsAnalyzing(true);
    analyzeInFlightRef.current = true;

    try {
      const response = await fetch("/api/skincare-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: cleaned,
          skinType: skinType ?? "",
          skinGoals,
          productTypeOverride:
            productTypeOverride === "auto" ? "" : productTypeOverride,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const safeMessage =
          typeof data?.error === "string"
            ? data.error
            : "Unable to analyze right now. Please try again.";
        throw new Error(safeMessage);
      }

      const result = data as AnalysisResult;
      setAnalysis(result);
      setWhyScoreOpen(false);
      setLastScoredFor({
        skinType: skinType ?? "",
        skinGoals: [...skinGoals],
        productTypeOverride,
      });

      const bodyOverride =
        productTypeOverride === "auto" ? "" : productTypeOverride;
      const pt = result.productType ?? "unknown";
      if (pt === "unknown") {
        setAlternativesItems([]);
        setAlternativesLoading(false);
      } else {
        setAlternativesLoading(true);
        void fetch("/api/skincare-alternatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredients: cleaned,
            skinType: skinType ?? "",
            skinGoals,
            productType: pt,
            productTypeOverride: bodyOverride,
            score: Math.round(
              typeof result.score === "number" ? result.score : 0
            ),
          }),
        })
          .then(async (altRes) => {
            const altData = await altRes.json().catch(() => ({}));
            if (!altRes.ok) {
              throw new Error(
                typeof altData?.error === "string"
                  ? altData.error
                  : "Alternatives failed"
              );
            }
            const list = Array.isArray(altData.alternatives)
              ? (altData.alternatives as AlternativePick[])
              : [];
            setAlternativesItems(list);
            setAlternativesError(false);
          })
          .catch(() => {
            setAlternativesError(true);
            setAlternativesItems([]);
          })
          .finally(() => {
            setAlternativesLoading(false);
          });
      }
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Unable to analyze right now. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
      analyzeInFlightRef.current = false;
    }
  }

  function buildShareText(score: number): string {
    if (score >= 8) return `My skincare scored ${score}/10 Pretty good!`;
    if (score >= 5) {
      return `My skincare scored ${score}/10 Not bad, but check if it fits your skin.`;
    }
    return `My skincare scored ${score}/10 Maybe not ideal for my skin.`;
  }

  async function handleShareResult() {
    if (!analysis) return;
    const score = outOfTen;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareText = buildShareText(score);
    const fallbackText = `${shareText}\n${url}`.trim();
    const webShareText = `My skincare product scored ${score}/10 on BeautyReviewty`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          text: webShareText,
          url,
        });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fallbackText);
        setShareNotice("Result copied!");
        return;
      }
    } catch {
      // If share is cancelled or clipboard fails, fall through to legacy copy.
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = fallbackText;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareNotice("Result copied!");
    } catch {
      setShareNotice("Result copied!");
    }
  }

  return (
    <main className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full min-w-0 max-w-5xl space-y-3 px-3 py-5 sm:px-4 sm:py-6 md:py-8">
        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50/90 via-rose-50/50 to-white p-4 shadow-sm sm:p-5">
          <h1 className="line-clamp-2 break-words text-2xl font-bold leading-tight text-rose-900 sm:text-3xl">
            Check your skincare
          </h1>

          <h2 className="mt-2 text-sm font-semibold text-rose-900">Your skin type</h2>
          <div className="mt-1 w-full min-w-0 max-w-full space-y-0.5">
            <div className={chipRowClass}>
              {SKIN_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleSkinType(t)}
                  className={skinType === t ? chipSelected : chipUnselected}
                >
                  <ChipLabel emoji={SKIN_TYPE_EMOJI[t]} text={t} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSkinGoals((v) => !v)}
              aria-expanded={showSkinGoals}
              className={`add-skin-goal-action mt-3.5 inline-flex w-full max-w-full shrink-0 items-center justify-center gap-1 rounded-full border border-solid px-4 py-2 text-[13px] font-semibold leading-tight text-rose-900 transition sm:w-auto md:py-2.5 ${
                showSkinGoals
                  ? "border-[rgba(200,112,154,0.55)] bg-rose-50/95 shadow-md shadow-rose-200/35 ring-1 ring-pink-200/50"
                  : "border-[rgba(200,118,154,0.42)] bg-white shadow-[0_2px_10px_rgba(219,39,119,0.1)] hover:border-[rgba(200,118,154,0.55)] hover:shadow-[0_3px_12px_rgba(219,39,119,0.14)] active:scale-[0.98]"
              }`}
            >
              {showSkinGoals ? (
                <>
                  <span aria-hidden className="text-base leading-none text-rose-600">
                    −
                  </span>
                  Hide skin goal
                </>
              ) : (
                <>
                  <span aria-hidden className="text-[15px] leading-none">
                    ➕
                  </span>
                  Add skin goal
                </>
              )}
            </button>
            {showSkinGoals ? (
              <div className="mt-1.5 space-y-0.5">
                <p className="text-sm font-medium text-rose-900/90">Skin goal</p>
                <div className={chipRowClass}>
                  {SKIN_GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      className={
                        skinGoals.includes(g) ? chipSelected : chipUnselected
                      }
                    >
                      <ChipLabel emoji={SKIN_GOAL_EMOJI[g]} text={g} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-2.5 w-full min-w-0">
              <button
                type="button"
                aria-expanded={advancedOptionsOpen}
                aria-controls="advanced-product-type-panel"
                id="advanced-options-trigger"
                onClick={() => setAdvancedOptionsOpen((open) => !open)}
                className="advanced-options-trigger flex w-full min-w-0 items-center justify-between gap-3 rounded-full border border-rose-200/75 bg-white/75 px-3.5 py-2.5 text-left shadow-[0_1px_6px_rgba(219,39,119,0.06)] backdrop-blur-sm transition-colors hover:bg-white hover:shadow-[0_2px_8px_rgba(219,39,119,0.08)] active:scale-[0.995] sm:px-4"
              >
                <span className="text-sm font-medium tracking-tight text-rose-800/90">
                  More options
                </span>
                <svg
                  className={`advanced-options-chevron size-5 shrink-0 text-rose-400/90 transition-transform duration-300 ease-out ${
                    advancedOptionsOpen ? "rotate-180" : "rotate-0"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                  advancedOptionsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div id="advanced-product-type-panel" className="min-h-0 overflow-hidden">
                  <div role="region" aria-labelledby="advanced-options-trigger" className="pt-2.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-rose-500/80">
                      Product type
                    </p>
                    <div className={chipRowClass}>
                      {PRODUCT_TYPE_OVERRIDE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setProductTypeOverride(opt.value)}
                          className={
                            productTypeOverride === opt.value
                              ? chipSelected
                              : chipUnselected
                          }
                        >
                          <span className="text-[13px]">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {selectionChangedSinceScore ? (
            <p className="mt-2 rounded-lg bg-amber-50/90 px-2.5 py-2 text-xs text-amber-900 ring-1 ring-amber-200/60">
              Selection changed — tap Check to update your score.
            </p>
          ) : null}

          <form
            onSubmit={handleCheck}
            className="mt-4 grid w-full min-w-0 max-w-full grid-cols-1 gap-2.5 md:mt-5 md:grid-cols-[auto_1fr_auto] md:gap-3"
          >
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            {showPhotoChoice ? (
              <div className="fixed inset-0 z-[120]">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/35"
                  aria-label="Close photo source selection"
                  onClick={() => setShowPhotoChoice(false)}
                />
                <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-rose-100/80 sm:left-1/2 sm:w-[min(100%,26rem)] sm:-translate-x-1/2 sm:rounded-2xl">
                  <p className="text-sm font-semibold text-rose-900">Add product photo</p>
                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={openCameraInput}
                      className="w-full rounded-xl border border-rose-200/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-white"
                    >
                      Take photo
                    </button>
                    <button
                      type="button"
                      onClick={openGalleryInput}
                      className="w-full rounded-xl border border-rose-200/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-white"
                    >
                      Choose from gallery
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="w-full min-w-0 md:w-auto">
            <button
              type="button"
              onClick={handleTakePhotoClick}
              disabled={ocrLoading || isAnalyzing}
              className="w-full min-w-0 rounded-xl border border-rose-200/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-white md:w-auto"
            >
              Scan ingredients
            </button>
              {ocrLoading ? (
                <div className="mt-2 w-full min-w-[10rem]" aria-busy role="progressbar">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-[11px] font-medium text-rose-700">
                      Reading ingredients...
                    </span>
                  </div>
                  <div className="ocr-progress-track mt-1.5 w-full rounded-full bg-rose-100/95">
                    <span className="ocr-progress-fill" />
                  </div>
                </div>
              ) : null}
              {!ocrLoading && isAnalyzing ? (
                <p className="mt-1.5 text-xs text-rose-700">Analyzing formula...</p>
              ) : null}
              {ocrErrorText ? (
                <p className="mt-1.5 text-xs text-rose-700">{ocrErrorText}</p>
              ) : null}
              {!ocrErrorText && ocrNotice ? (
                <p className="mt-1.5 text-xs text-rose-700">{ocrNotice}</p>
              ) : null}
            </div>
            <div className="relative min-w-0">
              <input
                type="text"
                placeholder="Or paste ingredients here…"
                value={ingredients}
                onChange={(event) => setIngredients(event.target.value)}
                className={`min-w-0 w-full max-w-full rounded-xl border-0 bg-white/95 py-2.5 text-sm text-rose-900 shadow-sm ring-1 ring-rose-100/80 placeholder:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 ${
                  ingredients.length > 0 ? "pl-3 pr-10" : "px-3"
                }`}
              />
              {ingredients.length > 0 ? (
                <button
                  type="button"
                  aria-label="Clear ingredients"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-rose-100/95 text-base leading-none text-rose-700 shadow-sm ring-1 ring-rose-200/70 transition hover:bg-rose-200/90"
                  onClick={() => setIngredients("")}
                >
                  <span aria-hidden>×</span>
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || ocrLoading}
              className={`relative z-0 w-full min-w-0 overflow-hidden rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-600 disabled:opacity-90 md:w-auto ${isAnalyzing ? "checking-shimmer" : ""}`}
            >
              {isAnalyzing ? (
                <span className="relative z-[1] inline-flex items-center justify-center gap-0">
                  <span>Analyzing</span>
                  <span className="analyzing-dots" aria-hidden>
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </span>
              ) : (
                "Check"
              )}
            </button>
          </form>
          {errorText ? (
            <p className="mt-2 break-words text-xs text-rose-700">{errorText}</p>
          ) : null}
        </section>

        <section
          ref={resultCardRef}
          className="w-full min-w-0 max-w-full space-y-2 overflow-hidden rounded-2xl bg-white p-3 shadow-sm sm:p-4"
        >
          <div
            className={`w-full min-w-0 max-w-full rounded-xl p-3 sm:p-4 ${scoreBlockStylesByNumber(
              outOfTen
            )}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-current/60">
              Result
            </p>
            <p className="mt-0.5 text-4xl font-bold tabular-nums leading-tight sm:text-5xl">
              {outOfTen}/10
            </p>
            {scoreForLine ? (
              <p className="mt-1 line-clamp-2 break-words text-xs text-current/50">
                {scoreForLine}
              </p>
            ) : null}
            <p className="mt-1 text-lg font-bold sm:text-xl">{bandLabel}</p>
            <p className="mt-1.5 line-clamp-3 break-words text-sm text-current/90">
              {labelLine}
            </p>
          </div>

          <div className="flex flex-wrap items-stretch gap-2 gap-y-2">
            <button
              type="button"
              onClick={() => setWhyScoreOpen(true)}
              className="min-h-[42px] min-w-0 flex-1 rounded-xl bg-rose-50/80 px-3 py-2 text-left text-sm font-semibold text-pink-700 ring-1 ring-rose-200/60 transition hover:bg-rose-50 hover:ring-rose-300/70 sm:flex-[1_1_60%]"
              aria-expanded={whyScoreOpen}
              aria-controls={whyScoreOpen ? "why-score-panel" : undefined}
            >
              Why this got {outOfTen}/10 →
            </button>
            {analysis ? (
              <div className="flex flex-1 shrink-0 flex-col items-start justify-center sm:flex-[0_1_auto] sm:justify-end">
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="rounded-full border border-rose-200/70 bg-white/80 px-2.5 py-1 text-left text-[10px] font-medium leading-tight text-pink-600 transition hover:bg-rose-50 hover:text-pink-700"
                >
                  Share result ↗
                </button>
                {shareNotice ? (
                  <span className="mt-0.5 text-[10px] text-rose-600">{shareNotice}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="w-full min-w-0 max-w-full">
            <h3 className="text-base font-semibold text-rose-900">Better alternatives</h3>
            {alternativesSection.detectedLine ? (
              <p className="mt-1 text-[10px] font-normal leading-snug text-rose-400/90">
                {alternativesSection.detectedLine}
              </p>
            ) : null}
            {alternativesSection.loading ? (
              <p className="mt-2 text-xs font-medium text-rose-600/90">
                Finding better alternatives…
              </p>
            ) : null}
            {alternativesSection.error ? (
              <p className="mt-2 text-xs text-rose-700/95">
                Could not load alternatives right now.
              </p>
            ) : null}
            {alternativesSection.confidenceNote ? (
              <p className="mt-1 text-xs leading-snug text-amber-900/90">
                {alternativesSection.confidenceNote}
              </p>
            ) : null}
            {alternativesSection.emptyHint && alternativesSection.items.length === 0 ? (
              <p className="mt-2 rounded-lg bg-rose-50/90 px-3 py-2.5 text-xs leading-relaxed text-rose-800 ring-1 ring-rose-100/80">
                {alternativesSection.emptyHint}
              </p>
            ) : null}
            {alternativesSection.loading ? (
              <div className="relative mt-3 -mx-0.5 min-w-0 max-w-full">
                <div
                  className="flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                  aria-busy
                  aria-label="Loading product suggestions"
                >
                  {ALT_SKELETON_INDICES.map((i) => (
                    <AlternativeCardSkeleton key={`alt-skel-${i}`} />
                  ))}
                </div>
              </div>
            ) : null}
            {alternativesSection.items.length > 0 ? (
              <div className="relative mt-3 -mx-0.5 min-w-0 max-w-full">
                <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                  {alternativesSection.items.map((alt, idx) => (
                    <AlternativeCard
                      key={`${alt.brand ?? ""}-${alt.productName}-${idx}`}
                      alt={alt}
                    />
                  ))}
                </div>
              </div>
            ) : !alternativesSection.isDemo &&
              !alternativesSection.loading &&
              !alternativesSection.error &&
              !alternativesSection.emptyHint ? (
              <p className="mt-2 text-xs text-rose-600/85">No alternatives to show.</p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl bg-rose-50/40 px-2 py-1.5 shadow-sm ring-1 ring-rose-100/50 sm:px-2.5 sm:py-2">
            <h3 className="text-[13px] font-semibold leading-snug text-rose-900">
              Is it right for you?
            </h3>
            <div className="mt-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-800">
                Good for
              </p>
              <div className="mt-0.5 flex min-h-0 min-w-0 max-w-full flex-wrap gap-0.5 content-start leading-none">
                {bestForItems.length > 0 ? (
                  bestForItems.map((item, idx) => (
                    <span
                      key={`bf-${idx}-${item.slice(0, 8)}`}
                      className="inline-block max-w-full min-w-0 truncate rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-medium leading-tight text-emerald-900 sm:max-w-[12rem]"
                      title={item}
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] leading-tight text-rose-600/80">—</span>
                )}
              </div>
            </div>
            <div className="mt-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-red-800">
                Be careful
              </p>
              <div className="mt-0.5 flex min-h-0 min-w-0 max-w-full flex-wrap gap-0.5 content-start leading-none">
                {notIdealItems.length > 0 ? (
                  notIdealItems.map((item, idx) => (
                    <span
                      key={`ni-${idx}-${item.slice(0, 8)}`}
                      className="inline-block max-w-full min-w-0 truncate rounded-full bg-red-100 px-1.5 py-px text-[10px] font-medium leading-tight text-red-900 sm:max-w-[12rem]"
                      title={item}
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] leading-tight text-rose-600/80">—</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {whyScoreOpen ? (
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label="Close score explanation"
              onClick={() => setWhyScoreOpen(false)}
            />
            <div
              id="why-score-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="why-score-title"
              className="absolute bottom-0 left-0 right-0 z-[101] max-h-[min(88vh,32rem)] overflow-y-auto rounded-t-2xl border border-rose-100/90 bg-white px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(85vh,36rem)] sm:w-[min(100%,28rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:px-5 sm:pb-5 sm:pt-4 sm:shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-rose-200/90 sm:hidden" />
              <div className="flex items-start justify-between gap-2">
                <h2
                  id="why-score-title"
                  className="text-base font-bold leading-tight text-rose-900"
                >
                  Why this got {outOfTen}/10
                </h2>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-lg leading-none text-rose-700 ring-1 ring-rose-200/70 hover:bg-rose-100"
                  onClick={() => setWhyScoreOpen(false)}
                >
                  <span aria-hidden>×</span>
                </button>
              </div>
              <div className="mt-4 space-y-4 text-sm text-rose-900/95">
                <div className="rounded-xl bg-rose-50/60 px-3 py-2.5 ring-1 ring-rose-100/80">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                    👤 Skin type fit
                  </p>
                  <p className="mt-1 leading-snug text-rose-900/95">
                    {scoreExplanationView.skinFit}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50/60 px-3 py-2.5 ring-1 ring-rose-100/80">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                    🎯 Selected goal match
                  </p>
                  <p className="mt-1 leading-snug text-rose-900/95">
                    {scoreExplanationView.goalFit}
                  </p>
                </div>
                {scoreExplanationView.helpfulIngredients.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                      ✅ Helpful ingredients
                    </p>
                    <ul className="mt-2 space-y-2">
                      {scoreExplanationView.helpfulIngredients.map((item, idx) => (
                        <li
                          key={`h-${idx}-${item.name}`}
                          className="rounded-lg border border-emerald-200/70 bg-emerald-50/90 px-2.5 py-2 text-emerald-950"
                        >
                          <p className="font-bold text-emerald-950">{item.name}</p>
                          <p className="mt-0.5 text-[13px] leading-snug text-emerald-900/95">
                            {item.note}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {scoreExplanationView.cautionIngredients.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                      ⚠️ Caution ingredients
                    </p>
                    <ul className="mt-2 space-y-2">
                      {scoreExplanationView.cautionIngredients.map((item, idx) => (
                        <li
                          key={`c-${idx}-${item.name}`}
                          className="rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-2 text-rose-950"
                        >
                          <p className="font-bold text-rose-950">{item.name}</p>
                          <p className="mt-0.5 text-[13px] leading-snug text-rose-900/95">
                            {item.note}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {scoreExplanationView.helpfulIngredients.length === 0 &&
                scoreExplanationView.cautionIngredients.length === 0 ? (
                  <p className="text-[13px] leading-snug text-rose-600/90">
                    No ingredient callouts for this breakdown.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <section className="w-full min-w-0 max-w-full rounded-2xl bg-rose-50/50 p-3 shadow-sm sm:p-4">
          <Link
            href="/masters"
            className="flex w-full min-w-0 max-w-full items-center justify-center gap-1 rounded-lg bg-pink-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-pink-600"
          >
            Get help from a skincare expert near you
            <span aria-hidden>→</span>
          </Link>
        </section>
      </div>
      <style jsx>{`
        .checking-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            105deg,
            transparent 38%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 62%
          );
          animation: check-shimmer 1.9s ease-in-out infinite;
        }
        @keyframes check-shimmer {
          from {
            transform: translateX(-115%);
          }
          to {
            transform: translateX(115%);
          }
        }
        .analyzing-dots span {
          display: inline-block;
          width: 0.25em;
          animation: dot-bounce 1.1s ease-in-out infinite;
        }
        .analyzing-dots span:nth-child(1) {
          animation-delay: 0ms;
        }
        .analyzing-dots span:nth-child(2) {
          animation-delay: 120ms;
        }
        .analyzing-dots span:nth-child(3) {
          animation-delay: 240ms;
        }
        @keyframes dot-bounce {
          0%,
          40%,
          100% {
            opacity: 0.35;
          }
          20% {
            opacity: 1;
          }
        }
        .ocr-progress-track {
          position: relative;
          overflow: hidden;
          height: 5px;
        }
        .ocr-progress-fill {
          display: block;
          position: relative;
          height: 100%;
          width: 55%;
          max-width: 85%;
          border-radius: 9999px;
          background: linear-gradient(
            90deg,
            rgba(251, 207, 232, 0.95) 0%,
            rgba(244, 114, 182, 0.98) 40%,
            rgba(251, 113, 157, 0.95) 100%
          );
          animation: ocr-bar-indeterminate 1.45s ease-in-out infinite alternate;
        }
        .ocr-progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.55),
            transparent
          );
          animation: ocr-bar-shimmer 1.05s linear infinite;
        }
        @keyframes ocr-bar-indeterminate {
          from {
            transform: translateX(-12%);
          }
          to {
            transform: translateX(calc(182%));
          }
        }
        @keyframes ocr-bar-shimmer {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(260%);
          }
        }
      `}</style>
    </main>
  );
}

