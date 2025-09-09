import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const BATCH_SIZE = 400;

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    const backfillToken = request.headers.get('x-backfill-token');
    
    let isAuthorized = false;
    
    // Check for admin UID via Firebase Auth token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const adminAuth = getAuth();
        const decodedToken = await adminAuth.verifyIdToken(token);
        const adminUid = process.env.ADMIN_UID;
        if (adminUid && decodedToken.uid === adminUid) {
          isAuthorized = true;
        }
      } catch (error) {
        console.error('Failed to verify Firebase token:', error);
      }
    }
    
    // Check for backfill token
    if (!isAuthorized && backfillToken) {
      const expectedToken = process.env.BACKFILL_TOKEN;
      if (expectedToken && backfillToken === expectedToken) {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Requires valid Firebase Auth token for ADMIN_UID or BACKFILL_TOKEN header.' },
        { status: 401 }
      );
    }
    
    console.log('Starting backfill for listings missing createdAt...');
    
    let scanned = 0;
    let updated = 0;
    let hasMore = true;
    
    while (hasMore) {
      if (!db) {
        throw new Error("Firestore is not initialized. Check Firebase settings.");
      }
      // Query for listings without createdAt field
      const q = query(
        collection(db, 'listings'),
        where('createdAt', '==', null),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs;
      
      if (docs.length === 0) {
        hasMore = false;
        break;
      }
      
      // Create batch update
      const batch = writeBatch(db);
      
      docs.forEach((docSnapshot) => {
        const docRef = doc(db, 'listings', docSnapshot.id);
        batch.update(docRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
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
    
    const allListingsQuery = query(
      collection(db, 'listings'),
      limit(1000) // Reasonable limit for this check
    );
    
    const allListingsSnapshot = await getDocs(allListingsQuery);
    const undefinedCreatedAtDocs = allListingsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.createdAt === undefined;
    });
    
    if (undefinedCreatedAtDocs.length > 0) {
      console.log(`Found ${undefinedCreatedAtDocs.length} listings with undefined createdAt`);
      
      // Process in batches
      for (let i = 0; i < undefinedCreatedAtDocs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchDocs = undefinedCreatedAtDocs.slice(i, i + BATCH_SIZE);
        
        batchDocs.forEach((docSnapshot) => {
          const docRef = doc(db, 'listings', docSnapshot.id);
          batch.update(docRef, {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
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
