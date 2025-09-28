/**
 * One-time migration script to add participants array to existing bookings
 * Run this once to backfill existing booking documents
 * 
 * Usage: node scripts/migrate-bookings.js
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const app = initializeApp({
  credential: require('firebase-admin').credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function migrateBookings() {
  console.log('Starting booking migration...');
  
  try {
    const bookingsRef = db.collection('bookings');
    const snapshot = await bookingsRef.get();
    
    if (snapshot.empty) {
      console.log('No bookings found to migrate.');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Skip if participants array already exists
      if (data.participants && Array.isArray(data.participants)) {
        console.log(`Skipping ${doc.id} - already has participants array`);
        return;
      }
      
      // Add participants array based on existing clientId and masterUid/profileId
      const clientId = data.clientId || data.clientUid;
      const masterId = data.profileId || data.masterUid || data.masterId;
      
      if (clientId && masterId) {
        batch.update(doc.ref, {
          participants: [clientId, masterId],
          updatedAt: new Date(),
        });
        count++;
        console.log(`Queued migration for ${doc.id}: [${clientId}, ${masterId}]`);
      } else {
        console.warn(`Skipping ${doc.id} - missing clientId or masterId`);
      }
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`✅ Successfully migrated ${count} booking documents`);
    } else {
      console.log('No bookings needed migration');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateBookings();
