import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendBookingStatusEmailToClient } from '@/lib/email/bookingEmails';
import { formatWhenFromBooking } from '@/lib/emailFormat';
import { getEffectiveNotificationPrefsForUser } from '@/lib/settings/notifications';

export async function POST(req: Request) {
 try {
 const db = getAdminDb();
 if (!db) {
  return NextResponse.json(
   { ok: false, error: 'Admin DB not available' },
   { status: 500 }
  );
 }
 const { bookingId, status } = await req.json();
 
 // Get current booking to check previous status
 const bookingRef = db.collection('bookings').doc(bookingId);
 const bookingSnap = await bookingRef.get();
 if (!bookingSnap.exists) {
  return NextResponse.json({ error: "Booking not found" }, { status: 404 });
 }
 const previousData = bookingSnap.data() as any;
 const previousStatus = previousData.status;

 // Only send email if status actually changed and is one we care about
 const shouldSendEmail = 
  previousStatus !== status && 
  ['confirmed', 'declined', 'cancelled'].includes(status);

 await bookingRef.update({ status });

 // Email notification to client (best-effort, after status update)
 if (shouldSendEmail) {
  try {
    const updatedBooking = await bookingRef.get();
    const bookingData = updatedBooking.exists ? (updatedBooking.data() as any) : null;
    if (bookingData && bookingData.clientUid) {
      const clientUid = bookingData.clientUid || bookingData.clientId || null;
      if (clientUid) {
        // Get effective notification preferences for client
        const prefs = await getEffectiveNotificationPrefsForUser(clientUid);

        // Check if notifications are enabled for booking status changes
        if (!prefs.bookingStatusChangeEnabled) {
          console.log('[email-booking] skip: client disabled booking status emails', {
            clientUserId: clientUid,
            bookingId,
            status,
          });
        } else if (!prefs.emailForNotifications) {
          console.log('[email-booking] skip: no email for notifications', {
            clientUserId: clientUid,
            bookingId,
            status,
          });
        } else {
          // Load client profile for display name
          const clientProfileSnap = await db.collection('profiles').doc(clientUid).get();
          const clientProfile = clientProfileSnap.exists ? (clientProfileSnap.data() as any) : null;
          const bookingDateTimeText = formatWhenFromBooking(bookingData);
          const masterUid = bookingData.masterUid || bookingData.masterId || null;
          let masterName: string | null = null;
          if (masterUid) {
            try {
              const masterProfileSnap = await db.collection('profiles').doc(masterUid).get();
              if (masterProfileSnap.exists) {
                const masterProfileData = masterProfileSnap.data() as any;
                masterName = masterProfileData?.displayName || null;
              }
            } catch {
              // ignore master profile lookup errors
            }
          }
          let serviceName: string | null = null;
          if (bookingData.listingId) {
            try {
              const ls = await db.collection('listings').doc(bookingData.listingId).get();
              if (ls.exists) {
                const listingData = ls.data() as any;
                serviceName = listingData?.title || listingData?.serviceName || null;
              }
            } catch {
              // ignore listing load errors
            }
          }
          const host = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const dashboardBookingUrl = `${host}/dashboard/bookings`;
          
          await sendBookingStatusEmailToClient({
            clientEmail: prefs.emailForNotifications,
            clientName: clientProfile?.displayName || null,
            masterName,
            serviceName,
            bookingDateTimeText,
            bookingId,
            status: status as 'confirmed' | 'declined' | 'cancelled',
            dashboardBookingUrl,
          });
        }
      }
    }
  } catch (emailErr) {
    console.error('[booking/status] email error', emailErr);
  }
 }

 return NextResponse.json({ ok: true });
 } catch (e: any) {
 console.error('[booking/status]', e);
 return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
 }
}