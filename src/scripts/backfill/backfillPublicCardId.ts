/**
 * DEV-ONLY. Match legacy reviews to publicCards and set publicCardId + threadKey.
 * Matching order:
 * 1) if review has masterSlug -> find publicCards where slug==masterSlug
 * 2) else try normalized title eq review.masterName normalized
 * 3) else skip & log
 * DO NOT touch photos.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

async function runBackfill() {
  console.log('THREAD_DEBUG BACKFILL: Starting backfill process...');
  
  const reviews = await db.collection('reviews').where('publicCardId','==',null).limit(500).get();
  console.log(`THREAD_DEBUG BACKFILL: Found ${reviews.docs.length} reviews without publicCardId`);
  
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
      continue;
    }
    
    const publicCardId = card.id;
    const threadKey = `pc_${publicCardId}`;
    console.log('THREAD_DEBUG BACKFILL: update review', docSnap.id, '→', publicCardId);
    await docSnap.ref.update({ publicCardId, threadKey });
  }
  
  console.log('THREAD_DEBUG BACKFILL: Backfill completed');
}

// Make this callable only on DEV (guard by env var / admin uid)
if (process.env.NODE_ENV === 'development') {
  runBackfill().catch(console.error);
} else {
  console.log('THREAD_DEBUG BACKFILL: Skipping backfill - not in development mode');
}
