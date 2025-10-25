import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

/**
 * DEV-ONLY. Match legacy reviews to publicCards and set publicCardId + threadKey.
 * Matching order:
 * 1) if review has masterSlug -> find publicCards where slug==masterSlug
 * 2) else try normalized title eq review.masterName normalized
 * 3) else skip & log
 * DO NOT touch photos.
 */
async function runBackfill() {
  console.log('THREAD_DEBUG BACKFILL: Starting backfill process...');
  
  const reviews = await db.collection('reviews').where('publicCardId','==',null).limit(500).get();
  console.log(`THREAD_DEBUG BACKFILL: Found ${reviews.docs.length} reviews without publicCardId`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const docSnap of reviews.docs) {
    const r = docSnap.data();
    let card: FirebaseFirestore.DocumentSnapshot | null = null;

    // 1) Try to match by masterSlug
    if (r.masterSlug) {
      const q = await db.collection('publicCards').where('slug','==',r.masterSlug).limit(1).get();
      if (!q.empty) card = q.docs[0];
    }
    
    // 2) Try to match by normalized title
    if (!card && r.masterName) {
      const normalized = (r.masterName as string).trim().toLowerCase();
      const q = await db.collection('publicCards')
        .where('titleLower','==', normalized) // if we have this mirror field; else skip this step
        .limit(1).get();
      if (!q.empty) card = q.docs[0];
    }
    
    if (!card) {
      console.log('THREAD_DEBUG BACKFILL: skip review', docSnap.id);
      skippedCount++;
      continue;
    }
    
    const publicCardId = card.id;
    const threadKey = `pc_${publicCardId}`;
    console.log('THREAD_DEBUG BACKFILL: update review', docSnap.id, '→', publicCardId);
    await docSnap.ref.update({ publicCardId, threadKey });
    updatedCount++;
  }
  
  console.log('THREAD_DEBUG BACKFILL: Backfill completed');
  return { updatedCount, skippedCount, totalProcessed: reviews.docs.length };
}

export async function POST(request: NextRequest) {
  // Guard by environment - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Backfill only available in development' }, { status: 403 });
  }

  try {
    const result = await runBackfill();
    return NextResponse.json({ 
      success: true, 
      message: 'Backfill completed successfully',
      ...result 
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ 
      error: 'Backfill failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
