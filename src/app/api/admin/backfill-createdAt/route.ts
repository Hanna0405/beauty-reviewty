export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

function isAllowed() {
  // Disable by default in Preview/Production unless explicitly enabled
  if (process.env.ALLOW_BACKFILL !== 'true') return false;
  // Optional: protect with secret header if you already use one
  return true;
}

const BATCH_SIZE = 400;

export async function GET() {
  if (!isAllowed()) {
    return NextResponse.json({ ok: false, error: 'disabled' }, { status: 403 });
  }
  // TODO: your backfill logic using adminDb()
  return NextResponse.json({ ok: true });
}

export async function POST() {
  if (!isAllowed()) {
    return NextResponse.json({ ok: false, error: 'disabled' }, { status: 403 });
  }
  
  try {
    
    console.log('Starting backfill for listings missing createdAt...');
    
    let scanned = 0;
    let updated = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Query for listings without createdAt field
      const q = adminDb.collection('listings')
        .where('createdAt', '==', null)
        .limit(BATCH_SIZE);
      
      const querySnapshot = await q.get();
      const docs = querySnapshot.docs;
      
      if (docs.length === 0) {
        hasMore = false;
        break;
      }
      
      // Create batch update
      const batch = adminDb.batch();
      
      docs.forEach((docSnapshot) => {
        const docRef = adminDb.collection('listings').doc(docSnapshot.id);
        batch.update(docRef, {
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      });
      
      // Commit batch
      await batch.commit();
      
      scanned += docs.length;
      updated += docs.length;
      
      console.log(`Processed batch: ${docs.length} listings updated. Total: ${updated}`);
      
      // If we got fewer docs than the limit, we're done
      if (docs.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
    
    // Also check for listings where createdAt is undefined (not just null)
    console.log('Checking for listings with undefined createdAt...');
    
    const allListingsQuery = adminDb.collection('listings')
      .limit(1000); // Reasonable limit for this check
    
    const allListingsSnapshot = await allListingsQuery.get();
    const undefinedCreatedAtDocs = allListingsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.createdAt === undefined;
    });
    
    if (undefinedCreatedAtDocs.length > 0) {
      console.log(`Found ${undefinedCreatedAtDocs.length} listings with undefined createdAt`);
      
      // Process in batches
      for (let i = 0; i < undefinedCreatedAtDocs.length; i += BATCH_SIZE) {
        const batch = adminDb.batch();
        const batchDocs = undefinedCreatedAtDocs.slice(i, i + BATCH_SIZE);
        
        batchDocs.forEach((docSnapshot) => {
          const docRef = adminDb.collection('listings').doc(docSnapshot.id);
          batch.update(docRef, {
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        });
        
        await batch.commit();
        updated += batchDocs.length;
        console.log(`Updated batch of ${batchDocs.length} listings with undefined createdAt`);
      }
    }
    
    const result = {
      scanned: scanned + allListingsSnapshot.size,
      updated,
      message: `Backfill completed. Scanned ${scanned + allListingsSnapshot.size} listings, updated ${updated} listings.`
    };
    
    console.log('Backfill completed:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      { error: 'Internal server error during backfill', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
