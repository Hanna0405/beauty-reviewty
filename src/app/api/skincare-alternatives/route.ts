import { NextResponse } from "next/server";
import {
  skincareProducts,
  type SkincareProduct,
  type SkincareProductType,
} from "@/lib/skincareProducts";

/** Response shape consumed by /skincare-checker */
type AlternativePick = {
  label: string;
  productName: string;
  brand: string;
  reason: string;
  priceTier: "budget" | "mid-range" | "premium";
  imageUrl: string;
  productUrl: string;
};

type AnalyzeProductType =
  | "moisturizer"
  | "serum"
  | "sunscreen"
  | "cleanser"
  | "toner"
  | "acne treatment"
  | "barrier repair"
  | "face oil"
  | "mask"
  | "unknown";

function parseBodySkinGoals(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}

function parseProductTypeOverride(body: Record<string, unknown>): string {
  const v = body.productTypeOverride;
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function productTypeFromUserOverride(raw: string): AnalyzeProductType | null {
  const r = raw.trim().toLowerCase();
  if (!r || r === "auto") return null;
  const map: Record<string, AnalyzeProductType> = {
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

function sanitizeIncomingProductType(raw: unknown): AnalyzeProductType {
  if (typeof raw !== "string") return "unknown";
  const t = raw.trim().toLowerCase();
  const allowed = new Set<string>([
    "moisturizer",
    "serum",
    "sunscreen",
    "cleanser",
    "toner",
    "acne treatment",
    "barrier repair",
    "face oil",
    "mask",
    "unknown",
  ]);
  if (allowed.has(t)) return t as AnalyzeProductType;
  return "unknown";
}

function normalizeSkinType(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

const UI_GOAL_TO_DB: Record<string, string[]> = {
  Hydration: ["hydration"],
  Glow: ["brightening"],
  "Anti-aging": ["anti-aging"],
  "Calm redness": ["soothing"],
  "Barrier repair": ["barrier repair"],
  "Acne support": ["acne"],
};

function mapUiGoalsToDbKeys(goals: string[]): string[] {
  const out = new Set<string>();
  for (const g of goals) {
    const mapped = UI_GOAL_TO_DB[g];
    if (mapped) mapped.forEach((x) => out.add(x));
    else out.add(g.trim().toLowerCase());
  }
  return [...out];
}

/** Map analyzer types to rows in skincareProducts.ts */
function toDbProductType(t: AnalyzeProductType): SkincareProductType | null {
  if (t === "unknown") return null;
  if (t === "face oil") return "serum";
  if (t === "mask") return "moisturizer";
  const db: SkincareProductType[] = [
    "moisturizer",
    "serum",
    "sunscreen",
    "cleanser",
    "toner",
    "acne treatment",
    "barrier repair",
  ];
  if (db.includes(t as SkincareProductType)) return t as SkincareProductType;
  return null;
}

function skinTypeMatchScore(
  product: SkincareProduct,
  userSkin: string
): number {
  if (!userSkin) return 3000;
  const st = normalizeSkinType(userSkin);
  const types = product.skinTypes.map((x) => x.toLowerCase());
  if (types.includes("all")) return 10_000;
  if (types.includes(st)) return 10_000;
  if (st === "acne-prone" && types.some((t) => t.includes("acne"))) return 8500;
  if (types.includes("normal")) return 3500;
  return 1200;
}

function goalMatchScore(product: SkincareProduct, dbGoals: string[]): number {
  if (dbGoals.length === 0) return 1500;
  const pg = product.goals.map((g) => g.toLowerCase());
  let s = 0;
  for (const g of dbGoals) {
    if (pg.includes(g)) s += 1800;
    else if (pg.some((p) => p.includes(g) || g.includes(p))) s += 700;
  }
  return s;
}

function avoidForPenalty(
  product: SkincareProduct,
  userSkin: string,
  dbGoals: string[]
): number {
  let pen = 0;
  const us = normalizeSkinType(userSkin);
  const ctx = [us, ...dbGoals].filter(Boolean).join(" ");
  for (const a of product.avoidFor) {
    const al = a.toLowerCase().replace(/_/g, "-");
    if (!al) continue;
    if (us && (al.includes(us) || (us.includes("sensitive") && al.includes("fragrance")))) {
      pen += 2200;
    }
    for (const g of dbGoals) {
      if (g && al.includes(g)) pen += 600;
    }
    if (ctx.includes("acne") && al.includes("fungal")) pen += 400;
  }
  return pen;
}

function tagRelevanceScore(product: SkincareProduct, dbGoals: string[], userSkin: string): number {
  const tags = product.tags.join(" ").toLowerCase();
  let s = 0;
  for (const g of dbGoals) {
    if (!g) continue;
    if (tags.includes(g)) s += 120;
    const parts = g.split(/[-\s]+/);
    for (const p of parts) {
      if (p.length > 2 && tags.includes(p)) s += 45;
    }
  }
  const us = normalizeSkinType(userSkin);
  if (us && tags.includes(us)) s += 80;
  if (us.includes("oil") && tags.includes("oil-free")) s += 100;
  return Math.min(s, 900);
}

function popularityScore(p: SkincareProduct): number {
  return p.skinTypes.length * 120 + p.goals.length * 90 + p.tags.length * 40;
}

function totalRankScore(
  p: SkincareProduct,
  userSkin: string,
  dbGoals: string[]
): number {
  return (
    skinTypeMatchScore(p, userSkin) +
    goalMatchScore(p, dbGoals) +
    tagRelevanceScore(p, dbGoals, userSkin) -
    avoidForPenalty(p, userSkin, dbGoals)
  );
}

function buildReason(
  p: SkincareProduct,
  userSkin: string,
  dbGoals: string[],
  fitScore: number
): string {
  const bits: string[] = [];
  const us = userSkin.trim();
  if (us && p.skinTypes.map((x) => x.toLowerCase()).includes(normalizeSkinType(us))) {
    bits.push(`fits ${us} skin`);
  }
  if (dbGoals.length) {
    const hits = dbGoals.filter((g) =>
      p.goals.map((x) => x.toLowerCase()).includes(g)
    );
    if (hits.length) bits.push(`supports ${hits.slice(0, 2).join(" & ")}`);
  }
  bits.push(`${p.productType} pick`);
  if (fitScore < 4000) bits.push("popular in this category");
  const r = bits.join(" · ");
  return r.length > 130 ? `${r.slice(0, 127)}…` : r;
}

function labelForRank(rank: number, fitScore: number): string {
  if (rank === 0 && fitScore >= 8000) return "Top match";
  if (fitScore >= 7500) return "Great match";
  if (fitScore >= 5500) return "Good option";
  if (fitScore >= 3500) return "Solid pick";
  return "Popular pick";
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** Deterministic-ish RNG from string (stable per request payload) + time for variety between sessions */
function makeRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = (h + Date.now()) >>> 0;
  return function () {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

function rankAndPick(
  pool: SkincareProduct[],
  userSkin: string,
  dbGoals: string[],
  ingredients: string,
  limit: number
): AlternativePick[] {
  type Scored = { p: SkincareProduct; score: number };
  const scored: Scored[] = pool.map((p) => ({
    p,
    score: totalRankScore(p, userSkin, dbGoals),
  }));
  scored.sort((a, b) => b.score - a.score);

  const bucketSize = 280;
  const bucketMap = new Map<number, Scored[]>();
  for (const row of scored) {
    const bucket = Math.floor(row.score / bucketSize);
    const arr = bucketMap.get(bucket);
    if (arr) arr.push(row);
    else bucketMap.set(bucket, [row]);
  }
  const bucketKeys = [...bucketMap.keys()].sort((a, b) => b - a);

  const rng = makeRng(
    `${ingredients}|${userSkin}|${dbGoals.join(",")}|${pool[0]?.productType ?? ""}`
  );
  const flat: Scored[] = [];
  for (const k of bucketKeys) {
    const g = bucketMap.get(k)!;
    shuffleInPlace(g, rng);
    flat.push(...g);
  }

  const strongThreshold = 5200;
  const best = flat[0]?.score ?? 0;
  let picks: Scored[];

  if (best < strongThreshold) {
    const byPop = [...pool].sort(
      (a, b) => popularityScore(b) - popularityScore(a)
    );
    const popBuckets = new Map<number, SkincareProduct[]>();
    for (const p of byPop) {
      const b = Math.floor(popularityScore(p) / 180);
      const arr = popBuckets.get(b);
      if (arr) arr.push(p);
      else popBuckets.set(b, [p]);
    }
    const popFlat: SkincareProduct[] = [];
    for (const key of [...popBuckets.keys()].sort((a, b) => b - a)) {
      const g = popBuckets.get(key)!;
      shuffleInPlace(g, rng);
      popFlat.push(...g);
    }
    const keep = Math.min(2, flat.length);
    const merged: Scored[] = flat.slice(0, keep);
    const seen = new Set(merged.map((m) => m.p.id));
    for (const p of popFlat) {
      if (merged.length >= limit) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push({ p, score: totalRankScore(p, userSkin, dbGoals) });
    }
    if (merged.length < limit) {
      for (const row of flat) {
        if (merged.length >= limit) break;
        if (seen.has(row.p.id)) continue;
        seen.add(row.p.id);
        merged.push(row);
      }
    }
    picks = merged.slice(0, limit);
  } else {
    picks = flat.slice(0, limit);
  }

  return picks.map((row, idx) => ({
    label: labelForRank(idx, row.score),
    productName: row.p.name,
    brand: row.p.brand,
    reason: buildReason(row.p, userSkin, dbGoals, row.score),
    priceTier: row.p.priceTier,
    imageUrl: row.p.imageUrl || "",
    productUrl: row.p.productUrl || "",
  }));
}

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
    const forced = productTypeFromUserOverride(parseProductTypeOverride(body));
    let incoming = sanitizeIncomingProductType(body.productType);
    if (forced) incoming = forced;

    if (!ingredients) {
      return NextResponse.json(
        { error: "Ingredients are required." },
        { status: 400 }
      );
    }

    if (incoming === "unknown") {
      return NextResponse.json({ alternatives: [] });
    }

    const dbType = toDbProductType(incoming);
    if (!dbType) {
      return NextResponse.json({ alternatives: [] });
    }

    const pool = skincareProducts.filter((p) => p.productType === dbType);
    if (pool.length === 0) {
      return NextResponse.json({ alternatives: [] });
    }

    const dbGoals = mapUiGoalsToDbKeys(skinGoals);

    const alternatives = rankAndPick(pool, skinType, dbGoals, ingredients, 6);

    return NextResponse.json({ alternatives });
  } catch (error) {
    console.error("[skincare-alternatives] error", error);
    return NextResponse.json(
      { error: "Unable to load alternatives right now." },
      { status: 500 }
    );
  }
}
