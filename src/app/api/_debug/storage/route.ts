// Debug endpoint: GET /api/_debug/storage
import { NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { getFirebaseAdmin } from '@/lib/firebase/admin'

// App Router export signatures (Next 13+)
export async function GET() {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 503 });
    }
    const { app, bucketName } = admin;
    const bucket = getStorage(app).bucket(bucketName)
    const [exists] = await bucket.exists()
    return NextResponse.json({ bucketName, exists })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}

// For Pages Router compatibility (ignored by App Router),
// export default handler if Next.js expects (CommonJS interop).
export default undefined as any
