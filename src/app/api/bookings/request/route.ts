import { NextResponse } from 'next/server';
import { adminDb, adminAuth, getAdminApp } from '@/lib/firebase-admin'; // централизованный импорт
import { sendNewBookingEmailToMaster } from '@/lib/email/bookingEmails';
import { getEffectiveNotificationPrefsForUser } from '@/lib/settings/notifications';
import { doesMasterAllowBookingRequestsServer } from '@/lib/settings/masterVisibilityServer';

function bad(message: string, code = 400) {
  return NextResponse.json({ ok: false, error: message }, { status: code });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return bad('Missing auth token', 401);

    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(idToken).catch(() => null);
    if (!decoded?.uid) return bad('Invalid auth token', 401);
    const clientUid = decoded.uid;

    // Parse JSON
    let body: any = null;
    try { body = await req.json(); } catch { return bad('Body must be JSON'); }
    if (!body || typeof body !== 'object') return bad('Empty body');

    const listingId = String(body.listingId || '').trim();
    let masterUid = String(body.masterUid || '').trim();
    const startAtISO = String(body.startAtISO || '').trim();
    const durationMin = Number(body.durationMin);
    const note = typeof body.note === 'string' ? body.note : undefined;

    if (!listingId) return bad('Missing listingId');
    if (!startAtISO) return bad('Missing startAtISO');
    if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 8 * 60) {
      return bad('Invalid durationMin');
    }

    const startAtDate = new Date(startAtISO);
    if (isNaN(startAtDate.getTime())) return bad('Invalid startAtISO');
    if (startAtDate.getTime() < Date.now() - 60_000) return bad('startAt must be in the future');

    const db = adminDb();

    // Load listing, infer masterUid from multiple common field names
    const snap = await db.collection('listings').doc(listingId).get();
    if (!snap.exists) return bad('Listing not found');
    const listing = snap.data() as any;

    const inferredMaster =
      listing?.masterUid ||
      listing?.userUid ||
      listing?.ownerUid ||
      listing?.profileId ||
      null;

    if (!masterUid) masterUid = inferredMaster ? String(inferredMaster) : '';
    if (!masterUid) return bad('masterUid not found on listing');

    // If listing has some master id, ensure consistency
    if (inferredMaster && String(inferredMaster) !== masterUid) {
      return bad('listing/master mismatch');
    }

    // Check if master allows booking requests (server-side check)
    const allowBooking = await doesMasterAllowBookingRequestsServer(masterUid);
    if (!allowBooking) {
      console.log('[booking] blocked: master disabled booking', {
        masterId: masterUid,
        clientId: clientUid,
      });
      return bad('booking-disabled-by-master', 403);
    }

    // Check if the booking date is an off day (server-side check)
    const bookingDateStr = startAtDate.toISOString().split('T')[0]; // Extract YYYY-MM-DD
    try {
      const masterProfileSnap = await db.collection('profiles').doc(masterUid).get();
      if (masterProfileSnap.exists) {
        const masterProfile = masterProfileSnap.data() as any;
        const offDays = Array.isArray(masterProfile?.offDays)
          ? masterProfile.offDays.filter((d: any) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
          : [];
        
        if (offDays.includes(bookingDateStr)) {
          console.log('[booking] blocked: booking on off day', {
            masterId: masterUid,
            bookingDate: bookingDateStr,
            clientId: clientUid,
          });
          return bad('booking-on-off-day', 403);
        }
      }
    } catch (offDayCheckError) {
      console.error('[booking] error checking off days:', offDayCheckError);
      // Continue with booking if off day check fails (fail open for safety)
    }

    const { Timestamp } = await import('firebase-admin/firestore');
    const now = new Date();

    const doc = {
      status: 'pending',
      listingId,
      masterUid,
      clientUid,
      startAt: Timestamp.fromDate(startAtDate),
      durationMin,
      note: note?.slice(0, 1000),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      listingTitle: listing?.title || listing?.name || undefined,
      cityName: listing?.city?.formatted || listing?.cityName || undefined,
    };

    const ref = await db.collection('bookings').add(doc);

    // Email notification to master (best-effort, after booking is written)
    try {
      // Get effective notification preferences for master
      const prefs = await getEffectiveNotificationPrefsForUser(masterUid);

      // Check if notifications are enabled for new booking requests
      if (!prefs.bookingNewRequestEnabled) {
        console.log('[email-booking] skip: master disabled new booking emails', {
          masterUserId: masterUid,
          bookingId: ref.id,
        });
      } else if (!prefs.emailForNotifications) {
        console.log('[email-booking] skip: no email for notifications', {
          masterUserId: masterUid,
          bookingId: ref.id,
        });
      } else {
        // Load master profile for display name
        const masterProfileSnap = await db.collection('profiles').doc(masterUid).get();
        const masterProfile = masterProfileSnap.exists
          ? (masterProfileSnap.data() as any)
          : null;
        // Format date/time
        const bookingDateTimeText = startAtDate.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        // Construct dashboard URL
        const host = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const dashboardBookingUrl = `${host}/dashboard/master/bookings`;

        // Get client profile for client name
        let clientName: string | null = null;
        try {
          const clientProfileSnap = await db.collection('profiles').doc(clientUid).get();
          if (clientProfileSnap.exists) {
            const clientProfileData = clientProfileSnap.data() as any;
            clientName = clientProfileData?.displayName || null;
          }
        } catch {
          // ignore client profile lookup errors
        }

        await sendNewBookingEmailToMaster({
          masterEmail: prefs.emailForNotifications,
          masterName: masterProfile?.displayName || null,
          clientName,
          serviceName: doc.listingTitle || null,
          bookingDateTimeText,
          bookingId: ref.id,
          bookingStatus: doc.status,
          dashboardBookingUrl,
        });
      }
    } catch (emailErr) {
      console.error('[bookings/request] email error', emailErr);
    }

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err: any) {
    console.error('BOOKING_REQUEST_ERROR', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}