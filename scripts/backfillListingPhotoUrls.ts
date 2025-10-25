// scripts/backfillListingPhotoUrls.ts
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

(async () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      /* reuse existing admin init (service account envs) */
    });
  }
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // Adjust collection/fields to match our schema:
  const listingsSnap = await db.collection("listings").get();
  let updated = 0;

  for (const doc of listingsSnap.docs) {
    const data = doc.data() as any;
    const photos: any[] = data.photos || [];
    let changed = false;

    const newPhotos = [];
    for (const p of photos) {
      if (p?.downloadURL) {
        newPhotos.push(p);
        continue;
      }

      const fullPath = p?.fullPath || p?.path; // support legacy field name if we had one
      if (!fullPath) {
        newPhotos.push(p);
        continue;
      }

      try {
        const file = bucket.file(fullPath);
        const [meta] = await file.getMetadata();
        let token = meta?.metadata?.firebaseStorageDownloadTokens;
        if (!token) {
          token = uuidv4();
          await file.setMetadata({
            metadata: { firebaseStorageDownloadTokens: token },
          });
        }
        const downloadURL =
          `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
          `${encodeURIComponent(file.name)}?alt=media&token=${token}`;

        newPhotos.push({ ...p, fullPath, downloadURL });
        changed = true;
      } catch (error) {
        console.warn(`Failed to process photo ${fullPath}:`, error);
        newPhotos.push(p); // keep original
      }
    }

    if (changed) {
      await doc.ref.update({ photos: newPhotos });
      updated++;
    }
  }

  console.log("Backfill complete. Updated listings:", updated);
  process.exit(0);
})();
