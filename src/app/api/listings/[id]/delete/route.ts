import { NextResponse } from 'next/server';
import { deleteListingById } from '@/lib/listings/deleteListing';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteListingById(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('POST /api/listings/[id]/delete failed:', err);
    const msg = err?.message || 'Internal error';
    const status = msg.includes('auth') ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
