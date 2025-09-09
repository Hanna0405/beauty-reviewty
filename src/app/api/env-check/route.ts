import { NextResponse } from "next/server";
export const runtime = "nodejs"; // ensure server (Node) runtime
export const dynamic = "force-dynamic"; // avoid edge/static caching in dev

export async function GET() {
  const keys = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  ];
  const env: Record<string,string> = {};
  for (const k of keys) {
    const v = process.env[k];
    if (!v) { env[k] = "missing"; continue; }
    env[k] = k === "FIREBASE_PRIVATE_KEY"
      ? (v.startsWith("-----BEGIN") || v.startsWith("\"-----BEGIN"))
        ? "BEGIN_PRIVATE_KEY..."
        : v.slice(0,30) + "..."
      : v;
  }
  return NextResponse.json({ env });
}