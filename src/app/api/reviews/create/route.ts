import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmins';
import { stripUndefined } from '@/lib/object-helpers';
import { getMasterProfileId } from '@/lib/listings/getMasterProfileId';
import type { ListingLike } from '@/lib/listings/getMasterProfileId';
import { notifyMasterOfNewReview } from '@/lib/reviews/notifyMasterOfNewReview';
import { ensurePublicCardForMasterServer } from '@/lib/reviewty/ensurePublicCardForMaster.server';

type ReviewPhoto = { url: string; path: string };
type ReviewSubjectType = 'master' | 'listing';

const bad = (msg: string, code = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status: code });

function labelFromValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value !== null) {
    const item = value as { name?: string; title?: string; label?: string; key?: string };
    return String(item.name || item.title || item.label || item.key || '').trim();
  }
  return '';
}

function cityFromProfile(profile: Record<string, unknown>): string {
  const city = profile.city;
  if (!city) return String(profile.cityName || '').trim();
  if (typeof city === 'string') return city.trim();
  if (typeof city === 'object' && city !== null) {
    const item = city as { formatted?: string; city?: string; name?: string };
    return String(item.formatted || item.city || item.name || '').trim();
  }
  return '';
}

function servicesFromProfile(profile: Record<string, unknown>): string[] {
  const labels: string[] = [];
  for (const key of ['serviceNames', 'services', 'serviceKeys'] as const) {
    const arr = profile[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const label = labelFromValue(item);
      if (label) labels.push(label);
    }
  }
  return [...new Set(labels)];
}

function languagesFromProfile(profile: Record<string, unknown>): string[] {
  const labels: string[] = [];
  for (const key of ['languageNames', 'languages'] as const) {
    const arr = profile[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const label = labelFromValue(item);
      if (label) labels.push(label);
    }
  }
  return [...new Set(labels)];
}

function resolveMasterUid(profile: Record<string, unknown>, fallbackId: string): string {
  return String(
    profile.uid || profile.userId || profile.ownerId || profile.userUID || fallbackId
  ).trim();
}

async function loadMasterProfile(subjectId: string) {
  const db = getAdminDb();
  for (const collectionName of ['profiles', 'masters']) {
    const snap = await db.collection(collectionName).doc(subjectId).get();
    if (snap.exists) {
      return { id: snap.id, data: snap.data() as Record<string, unknown> };
    }
  }

  for (const collectionName of ['profiles', 'masters']) {
    const qs = await db
      .collection(collectionName)
      .where('uid', '==', subjectId)
      .limit(1)
      .get();
    if (!qs.empty) {
      const docSnap = qs.docs[0];
      return { id: docSnap.id, data: docSnap.data() as Record<string, unknown> };
    }
  }

  return null;
}

async function resolveListingOwner(
  listingId: string,
  listingData: Record<string, unknown>
) {
  const rawOwnerId = getMasterProfileId(listingData as ListingLike);
  if (!rawOwnerId) return null;

  const listingName = String(
    listingData.title || listingData.masterName || listingData.displayName || ''
  ).trim();

  const profileResult = await loadMasterProfile(rawOwnerId);
  if (profileResult) {
    const profile = profileResult.data;
    return {
      masterUid: resolveMasterUid(profile, rawOwnerId),
      profilePathId: profileResult.id,
      masterName: String(
        profile.displayName || profile.name || listingName || 'Master'
      ).trim(),
    };
  }

  return {
    masterUid: rawOwnerId,
    profilePathId: rawOwnerId,
    masterName: listingName || 'Master',
  };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return bad('Missing Authorization token', 401);

    const decoded = await getAdminAuth().verifyIdToken(token);
    const authorUid = decoded.uid;
    const body = await req.json().catch(() => ({}));

    const {
      subject,
      rating,
      text = '',
      photos = [],
      source,
    }: {
      subject?: { type?: ReviewSubjectType; id?: string };
      rating?: number;
      text?: string;
      photos?: ReviewPhoto[];
      source?: string;
    } = body || {};

    if (!subject || (subject.type !== 'master' && subject.type !== 'listing') || !subject.id)
      return bad('Invalid subject: {type:"master"|"listing", id:string}');
    if (typeof rating !== 'number' || rating < 1 || rating > 5)
      return bad('Invalid rating (1..5).');

    const textStr = String(text ?? '').trim();
    if (textStr.length > 2000) return bad('Text too long (max 2000).');
    const sanitizedPhotos: ReviewPhoto[] = Array.isArray(photos)
      ? photos.slice(0, 3).map(p => ({ url: String(p?.url || ''), path: String(p?.path || '') }))
      : [];

    const now = Timestamp.now();
    let reviewPayload: Record<string, unknown>;

    if (subject.type === 'listing') {
      const listingId = subject.id;
      const listingSnap = await getAdminDb().collection('listings').doc(listingId).get();
      if (!listingSnap.exists) return bad('Referenced listing not found');

      const listingData = listingSnap.data() as Record<string, unknown>;
      const listingOwner = await resolveListingOwner(listingId, listingData);

      reviewPayload = {
        subject,
        subjectType: subject.type,
        subjectId: listingId,
        listingId,
        ...(listingOwner
          ? {
              masterId: listingOwner.masterUid,
              profileId: listingOwner.profilePathId,
              masterName: listingOwner.masterName,
            }
          : {}),
        authorUid,
        authorName: decoded.name || 'Verified client',
        rating,
        text: textStr,
        photos: sanitizedPhotos,
        updatedAt: now,
        source: source || 'listing-review',
        status: 'approved',
      };
    } else {
      const profileResult = await loadMasterProfile(subject.id);
      if (!profileResult) return bad('Referenced master not found');

      const profile = profileResult.data;
      const masterUid = resolveMasterUid(profile, subject.id);
      const displayName = String(profile.displayName || profile.name || 'Master').trim();
      const cityLabel = cityFromProfile(profile);
      const normSvc = servicesFromProfile(profile);
      const normLang = languagesFromProfile(profile);
      const masterSlug =
        String(profile.slug || '').trim() ||
        String(profileResult.id || '').trim() ||
        String(subject.id || '').trim();

      reviewPayload = {
        subject: { type: 'master', id: masterUid },
        subjectType: 'master',
        subjectId: masterUid,
        masterId: masterUid,
        profileId: profileResult.id,
        masterName: displayName,
        masterDisplay: displayName,
        masterCity: cityLabel,
        masterServices: normSvc,
        masterLanguages: normLang,
        masterKeywords: [
          displayName.toLowerCase(),
          cityLabel.toLowerCase(),
          ...normSvc.map((s) => s.toLowerCase()),
          ...normLang.map((l) => l.toLowerCase()),
        ].filter(Boolean),
        ...(masterSlug ? { masterSlug } : {}),
        masterRef: { type: 'master', id: masterUid },
        authorUid,
        authorName: decoded.name || 'Verified client',
        rating,
        text: textStr,
        photos: sanitizedPhotos,
        updatedAt: now,
        source: source || 'existing-master',
        status: 'approved',
      };
    }

    const dupField =
      subject.type === 'master'
        ? reviewPayload.masterId
        : subject.id;

    const dup = await getAdminDb()
      .collection('reviews')
      .where('authorUid', '==', authorUid)
      .where('subjectType', '==', subject.type)
      .where(subject.type === 'master' ? 'masterId' : 'subjectId', '==', dupField)
      .limit(1)
      .get();

    const subReviewPayload = {
      rating,
      text: textStr,
      photos: sanitizedPhotos,
      authorUid,
      authorName: decoded.name || 'Verified client',
      createdAt: now,
      masterId: subject.type === 'master' ? reviewPayload.masterId : subject.id,
    };

    const firestorePayload = stripUndefined(reviewPayload);

    if (!dup.empty) {
      const id = dup.docs[0].id;
      const docRef = getAdminDb().collection('reviews').doc(id);
      const prev = await docRef.get();
      await docRef.update({
        ...firestorePayload,
        ...(prev.get('createdAt') ? { createdAt: prev.get('createdAt') } : { createdAt: now }),
      });

      if (subject.type === 'master' && reviewPayload.masterId) {
        try {
          await getAdminDb()
            .collection('masters')
            .doc(String(reviewPayload.masterId))
            .collection('reviews')
            .add(subReviewPayload);
        } catch (err) {
          console.warn('[api/reviews/create] master subcollection write failed', err);
        }

        try {
          await ensurePublicCardForMasterServer(
            {
              masterId: String(reviewPayload.masterId),
              masterName: String(reviewPayload.masterName || 'Master'),
              masterCity: String(reviewPayload.masterCity || ''),
              masterServices: Array.isArray(reviewPayload.masterServices)
                ? (reviewPayload.masterServices as string[])
                : [],
              masterLanguages: Array.isArray(reviewPayload.masterLanguages)
                ? (reviewPayload.masterLanguages as string[])
                : [],
              profileId: String(reviewPayload.profileId || reviewPayload.masterId),
              reviewId: id,
              rating,
              text: textStr,
              photos: sanitizedPhotos,
              authorUid,
              authorName: decoded.name || 'Verified client',
            },
            { mirrorReview: false }
          );
        } catch (cardErr) {
          console.error('[api/reviews/create] ensurePublicCardForMaster failed (update)', cardErr);
        }
      }

      console.log('[api/reviews/create] updated review', { id, masterId: reviewPayload.masterId });
      return NextResponse.json({ ok: true, id, updated: true });
    }

    const doc = await getAdminDb().collection('reviews').add({
      ...firestorePayload,
      createdAt: now,
    });

    console.log('[api/reviews/create] created review', {
      id: doc.id,
      collection: 'reviews',
      masterId: reviewPayload.masterId,
      subjectType: reviewPayload.subjectType,
    });

    const resolvedMasterId = reviewPayload.masterId
      ? String(reviewPayload.masterId)
      : null;

    if (subject.type === 'master' && resolvedMasterId) {
      try {
        await getAdminDb()
          .collection('masters')
          .doc(resolvedMasterId)
          .collection('reviews')
          .add(subReviewPayload);
      } catch (err) {
        console.warn('[api/reviews/create] master subcollection write failed', err);
      }

        try {
          await ensurePublicCardForMasterServer(
            {
              masterId: resolvedMasterId,
              masterName: String(reviewPayload.masterName || 'Master'),
              masterCity: String(reviewPayload.masterCity || ''),
              masterServices: Array.isArray(reviewPayload.masterServices)
                ? (reviewPayload.masterServices as string[])
                : [],
              masterLanguages: Array.isArray(reviewPayload.masterLanguages)
                ? (reviewPayload.masterLanguages as string[])
                : [],
              profileId: String(reviewPayload.profileId || resolvedMasterId),
              reviewId: doc.id,
              rating,
              text: textStr,
              photos: sanitizedPhotos,
              authorUid,
              authorName: decoded.name || 'Verified client',
            },
            { mirrorReview: false }
          );
        } catch (cardErr) {
          console.error('[api/reviews/create] ensurePublicCardForMaster failed', cardErr);
        }
    }

    if (resolvedMasterId) {
      if (subject.type === 'listing') {
        console.log('[api/reviews/create] listing review notification attempted', {
          listingId: subject.id,
          masterId: resolvedMasterId,
        });
      }
      try {
        await notifyMasterOfNewReview({
          masterUid: resolvedMasterId,
          masterName: String(reviewPayload.masterName || 'Master'),
          profilePathId: String(
            reviewPayload.profileId || resolvedMasterId
          ),
          rating,
          text: textStr,
        });
      } catch (emailErr) {
        console.error('[api/reviews/create] review notification error', emailErr);
      }
    } else if (subject.type === 'listing') {
      console.log(
        '[api/reviews/create] listing review notification skipped: no masterId',
        { listingId: subject.id }
      );
    }

    return NextResponse.json({ ok: true, id: doc.id });
  } catch (e: any) {
    console.error('[api/reviews/create] error:', e);
    const status = String(e?.code || '').includes('auth') ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Internal error' }, { status });
  }
}
