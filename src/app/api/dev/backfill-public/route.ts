import { NextResponse } from "next/server";

// Note: This route is temporarily disabled due to Firebase SDK usage on server
// To use this backfill route, either:
// 1. Use Firebase Admin SDK instead of client SDK
// 2. Run the backfill logic on the client side
// 3. Create a separate admin script

export async function GET() {
  return NextResponse.json({ 
    message: "Backfill route is temporarily disabled. Use Firebase Admin SDK or client-side implementation.",
    updated: 0 
  });
}
