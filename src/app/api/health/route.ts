import { NextResponse } from 'next/server';

export async function GET() {
 try {
 const envFlags = {
 apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 hasAdminKey: !!process.env.FIREBASE_PRIVATE_KEY,
 apiKeyValue: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
 testVar: process.env.TEST_VAR,
 allEnvKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
 };
 // ping read access: just return flags, don't hit Firestore by default
 return NextResponse.json({ ok: true, env: envFlags });
 } catch (e: any) {
 console.error('[health]', e);
 return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
 }
}
