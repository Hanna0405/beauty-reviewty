'use client';
export default function EnvProbe() {
 const k = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
 console.log('[EnvProbe] ENV apiKey starts with:', k.slice(0, 6));
 return null;
}