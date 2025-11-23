import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { sendNewBookingEmailToMaster } from '@/lib/email/bookingEmails';
import { getEffectiveNotificationPrefsForUser } from '@/lib/settings/notifications';
import { doesMasterAllowBookingRequestsServer } from '@/lib/settings/masterVisibilityServer';

type Body = {
  listingId: string;
  masterUid: string;
  serviceKey: string;
  serviceName: string;
  start: string; // ISO UTC
  end: string; // ISO UTC
  notes?: string;
  phone?: string;
  price?: number;
};

export async function POST(req: Request) {
  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 503 });
    }
    const { auth, db } = admin;
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    const decoded = await auth.verifyIdToken(idToken);
    const clientUid = decoded.uid;

    const body = (await req.json()) as Body;
    if (!body.listingId || !body.masterUid || !body.serviceKey || !body.serviceName || !body.start || !body.end) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const startMs = Date.parse(body.start);
    const endMs = Date.parse(body.end);
    if (!isFinite(startMs) || !isFinite(endMs) || endMs <= startMs) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    // Check if master allows booking requests (server-side check)
    const allowBooking = await doesMasterAllowBookingRequestsServer(body.masterUid);
    if (!allowBooking) {
      console.log('[booking] blocked: master disabled booking', {
        masterId: body.masterUid,
        clientId: clientUid,
      });
      return NextResponse.json({ error: 'booking-disabled-by-master' }, { status: 403 });
    }

    // Check if the booking date is an off day (server-side check)
    const bookingDateStr = body.start ? new Date(body.start).toISOString().split('T')[0] : null;
    if (bookingDateStr) {
      try {
        const masterProfileSnap = await db.collection('profiles').doc(body.masterUid).get();
        if (masterProfileSnap.exists) {
          const masterProfile = masterProfileSnap.data() as any;
          const offDays = Array.isArray(masterProfile?.offDays)
            ? masterProfile.offDays.filter((d: any) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
            : [];
          
          if (offDays.includes(bookingDateStr)) {
            console.log('[booking] blocked: booking on off day', {
              masterId: body.masterUid,
              bookingDate: bookingDateStr,
              clientId: clientUid,
            });
            return NextResponse.json({ error: 'booking-on-off-day' }, { status: 403 });
          }
        }
      } catch (offDayCheckError) {
        console.error('[booking] error checking off days:', offDayCheckError);
        // Continue with booking if off day check fails (fail open for safety)
      }
    }

    const bookings = db.collection('bookings');

    const result = await db.runTransaction(async (tx) => {
      const q = await tx.get(
        bookings
          .where('masterUid', '==', body.masterUid)
          .where('status', 'in', ['pending', 'confirmed'])
          .where('startMs', '<', endMs)
      );
      const overlapping = q.docs.some(d => (d.data() as any).endMs > startMs);
      if (overlapping) throw new Error('Time slot not available');

      const now = Date.now();
      const ref = bookings.doc();
      tx.set(ref, {
        id: ref.id,
        listingId: body.listingId,
        masterUid: body.masterUid,
        clientUid,
        serviceKey: body.serviceKey,
        serviceName: body.serviceName,
        start: body.start,
        end: body.end,
        startMs,
        endMs,
        notes: body.notes || '',
        phone: body.phone || '',
        price: body.price ?? null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      return { id: ref.id };
    });

    // Email notification to master (best-effort, after booking is written)
    try {
      // Get effective notification preferences for master
      const prefs = await getEffectiveNotificationPrefsForUser(body.masterUid);

      // Check if notifications are enabled for new booking requests
      if (!prefs.bookingNewRequestEnabled) {
        console.log('[email-booking] skip: master disabled new booking emails', {
          masterUserId: body.masterUid,
          bookingId: result.id,
        });
      } else if (!prefs.emailForNotifications) {
        console.log('[email-booking] skip: no email for notifications', {
          masterUserId: body.masterUid,
          bookingId: result.id,
        });
      } else {
        // Load master profile for display name
        const masterProfileSnap = await db.collection('profiles').doc(body.masterUid).get();
        const masterProfile = masterProfileSnap.exists
          ? (masterProfileSnap.data() as any)
          : null;
        // Format date/time
        const startDate = new Date(body.start);
        const bookingDateTimeText = startDate.toLocaleString('en-US', {
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
          serviceName: body.serviceName || null,
          bookingDateTimeText,
          bookingId: result.id,
          bookingStatus: 'pending',
          dashboardBookingUrl,
        });
      }
    } catch (emailErr) {
      console.error('[bookingRequest] email error', emailErr);
    }

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 400 });
  }
}
