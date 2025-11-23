import { NextResponse } from 'next/server';
import { sendAppEmail } from '@/lib/email/resendClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const to =
 searchParams.get('to') ||
 process.env.TEST_EMAIL ||
 'delivered@resend.dev';

 await sendAppEmail({
 to,
 subject: 'BeautyReviewty Resend test',
 html: '<p>It works! <br/>BeautyReviewty Resend test email.</p>',
 text: 'It works! BeautyReviewty Resend test email.',
 });

 return NextResponse.json({ ok: true });
 } catch (error) {
 console.error('[test-resend] error', error);
 return NextResponse.json({ ok: false }, { status: 500 });
 }
}


