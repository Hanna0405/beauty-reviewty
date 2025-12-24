/**
 * Migration script to fix listing photo URLs
 *
 * Replaces signed Google Cloud URLs (containing GoogleAccessId or X-Goog-*)
 * with proper Firebase Storage download URLs.
 *
 * Usage:
 *   Dry-run (log only): DRY_RUN=true npx tsx scripts/migrate-listing-photo-urls.ts
 *   Execute: npx tsx scripts/migrate-listing-photo-urls.ts
 *
 * Requires Firebase Admin SDK environment variables:
 *   - FIREBASE_PROJECT_ID (or FIREBASE_PROJECT_ID_DEV)
 *   - FIREBASE_CLIENT_EMAIL (or FIREBASE_CLIENT_EMAIL_DEV)
 *   - FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_DEV)
 *   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV)
 */

import {
  getFirebaseAdmin,
  adminDb,
  adminBucket,
} from "../src/lib/firebase/admin";

interface PhotoData {
  url?: string;
  path?: string;
  downloadURL?: string;
  fullPath?: string;
  width?: number | null;
  height?: number | null;
  w?: number;
  h?: number;
  [key: string]: any; // Allow other fields
}

interface MigrationStats {
  totalListings: number;
  listingsWithSignedUrls: number;
  totalPhotos: number;
  photosFixed: number;
  photosSkipped: number;
  errors: number;
}

/**
 * Check if URL is a signed URL (contains GoogleAccessId or X-Goog-*)
 */
function isSignedUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("GoogleAccessId=") ||
    url.includes("X-Goog-Algorithm=") ||
    url.includes("X-Goog-Signature=")
  );
}

/**
 * Extract storage object path from signed URL
 *
 * Signed URLs typically look like:
 * https://storage.googleapis.com/BUCKET/PATH?GoogleAccessId=...&Expires=...&Signature=...
 * or
 * https://BUCKET.storage.googleapis.com/PATH?X-Goog-Algorithm=...&X-Goog-Signature=...
 */
function extractStoragePathFromSignedUrl(
  signedUrl: string,
  bucketName: string
): string | null {
  try {
    const url = new URL(signedUrl);

    // Pattern 1: https://storage.googleapis.com/BUCKET/PATH?...
    if (url.hostname === "storage.googleapis.com") {
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucketName);
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }
    }

    // Pattern 2: https://BUCKET.storage.googleapis.com/PATH?...
    if (url.hostname === `${bucketName}.storage.googleapis.com`) {
      return url.pathname.startsWith("/")
        ? url.pathname.slice(1)
        : url.pathname;
    }

    // Pattern 3: Try to extract from pathname if it looks like a storage path
    const pathname = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;
    if (pathname && !pathname.includes("?")) {
      // Check if path looks like a storage path (contains slashes, not just query params)
      if (pathname.split("/").length > 1) {
        return pathname;
      }
    }

    console.warn(
      `[migrate] Could not extract path from signed URL: ${signedUrl}`
    );
    return null;
  } catch (error) {
    console.error(`[migrate] Error parsing signed URL: ${signedUrl}`, error);
    return null;
  }
}

/**
 * Generate proper Firebase Storage download URL from storage path
 */
async function generateDownloadUrl(
  bucket: ReturnType<typeof adminBucket>,
  storagePath: string
): Promise<string | null> {
  try {
    const file = bucket.file(storagePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`[migrate] File does not exist: ${storagePath}`);
      return null;
    }

    // Get or create download token
    const [metadata] = await file.getMetadata();
    let tokenValue: string | undefined;

    // Extract token from metadata (handle both array and string formats)
    const existingToken = metadata.metadata?.firebaseStorageDownloadTokens;
    if (Array.isArray(existingToken) && existingToken.length > 0) {
      tokenValue = existingToken[0];
    } else if (typeof existingToken === "string" && existingToken.length > 0) {
      tokenValue = existingToken;
    }

    if (!tokenValue) {
      // Generate new token if missing
      const { v4: uuidv4 } = await import("uuid");
      tokenValue = uuidv4();
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: tokenValue },
      });
    }
    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${tokenValue}`;

    return downloadUrl;
  } catch (error) {
    console.error(
      `[migrate] Error generating download URL for ${storagePath}:`,
      error
    );
    return null;
  }
}

/**
 * Fix photo URL: replace signed URL with proper download URL
 */
async function fixPhotoUrl(
  photo: PhotoData,
  bucket: ReturnType<typeof adminBucket>,
  bucketName: string,
  dryRun: boolean
): Promise<{ fixed: boolean; newPhoto: PhotoData; error?: string }> {
  // Check all possible URL fields
  const urlFields = ["url", "downloadURL", "src"];
  let signedUrl: string | null = null;
  let urlField: string | null = null;

  for (const field of urlFields) {
    const value = photo[field];
    if (value && typeof value === "string" && isSignedUrl(value)) {
      signedUrl = value;
      urlField = field;
      break;
    }
  }

  if (!signedUrl || !urlField) {
    // No signed URL found, return as-is
    return { fixed: false, newPhoto: photo };
  }

  // Extract storage path from signed URL
  const storagePath = extractStoragePathFromSignedUrl(signedUrl, bucketName);
  if (!storagePath) {
    return {
      fixed: false,
      newPhoto: photo,
      error: "Could not extract storage path from signed URL",
    };
  }

  if (dryRun) {
    console.log(
      `[DRY-RUN] Would fix photo: ${signedUrl.substring(
        0,
        80
      )}... -> ${storagePath}`
    );
    // Return mock fixed photo for dry-run
    const mockDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
      storagePath
    )}?alt=media&token=MOCK_TOKEN`;
    return {
      fixed: true,
      newPhoto: { ...photo, [urlField]: mockDownloadUrl, path: storagePath },
    };
  }

  // Generate proper download URL
  const downloadUrl = await generateDownloadUrl(bucket, storagePath);
  if (!downloadUrl) {
    return {
      fixed: false,
      newPhoto: photo,
      error: "Could not generate download URL",
    };
  }

  // Create fixed photo object
  const newPhoto: PhotoData = {
    ...photo,
    [urlField]: downloadUrl,
    path: storagePath, // Store path for reference
  };

  return { fixed: true, newPhoto };
}

/**
 * Main migration function
 */
async function migrateListingPhotoUrls(dryRun: boolean = false): Promise<void> {
  console.log("=".repeat(60));
  console.log("Listing Photo URL Migration");
  console.log(
    `Mode: ${
      dryRun
        ? "DRY-RUN (no changes will be made)"
        : "LIVE (will update documents)"
    }`
  );
  console.log("=".repeat(60));

  // Initialize Firebase Admin
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw new Error(
      "Failed to initialize Firebase Admin. Check environment variables."
    );
  }

  const db = adminDb();
  const bucket = adminBucket();
  const bucketName = admin.bucketName;

  console.log(`\nUsing bucket: ${bucketName}`);
  console.log(`Collection: listings\n`);

  // Get all listings
  const listingsRef = db.collection("listings");
  const listingsSnap = await listingsRef.get();

  const stats: MigrationStats = {
    totalListings: listingsSnap.size,
    listingsWithSignedUrls: 0,
    totalPhotos: 0,
    photosFixed: 0,
    photosSkipped: 0,
    errors: 0,
  };

  console.log(`Found ${stats.totalListings} listings to process\n`);

  // Process each listing
  for (const docSnap of listingsSnap.docs) {
    const listingId = docSnap.id;
    const data = docSnap.data();
    const photos: PhotoData[] = Array.isArray(data.photos) ? data.photos : [];

    if (photos.length === 0) {
      continue;
    }

    stats.totalPhotos += photos.length;

    // Check if any photos have signed URLs
    const hasSignedUrls = photos.some((photo) => {
      const urlFields = ["url", "downloadURL", "src"];
      return urlFields.some((field) => {
        const value = photo[field];
        return value && typeof value === "string" && isSignedUrl(value);
      });
    });

    if (!hasSignedUrls) {
      continue;
    }

    stats.listingsWithSignedUrls++;
    console.log(
      `\n[Listing ${listingId}] Found ${photos.length} photos, checking for signed URLs...`
    );

    // Fix each photo
    const fixedPhotos: PhotoData[] = [];
    let listingChanged = false;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const result = await fixPhotoUrl(photo, bucket, bucketName, dryRun);

      if (result.fixed) {
        fixedPhotos.push(result.newPhoto);
        listingChanged = true;
        stats.photosFixed++;
        console.log(`  ✓ Photo ${i + 1}: Fixed signed URL`);
        if (result.error) {
          console.warn(`    Warning: ${result.error}`);
        }
      } else {
        fixedPhotos.push(photo);
        stats.photosSkipped++;
        if (result.error) {
          console.warn(`  ✗ Photo ${i + 1}: ${result.error}`);
          stats.errors++;
        }
      }
    }

    // Update listing if changed
    if (listingChanged) {
      if (dryRun) {
        console.log(
          `  [DRY-RUN] Would update listing ${listingId} with ${fixedPhotos.length} photos`
        );
      } else {
        try {
          await docSnap.ref.update({ photos: fixedPhotos });
          console.log(`  ✓ Updated listing ${listingId}`);
        } catch (error) {
          console.error(`  ✗ Failed to update listing ${listingId}:`, error);
          stats.errors++;
        }
      }
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Total listings processed: ${stats.totalListings}`);
  console.log(`Listings with signed URLs: ${stats.listingsWithSignedUrls}`);
  console.log(`Total photos processed: ${stats.totalPhotos}`);
  console.log(`Photos fixed: ${stats.photosFixed}`);
  console.log(`Photos skipped (no signed URLs): ${stats.photosSkipped}`);
  console.log(`Errors: ${stats.errors}`);

  if (dryRun) {
    console.log("\n⚠️  DRY-RUN mode: No changes were made to the database.");
    console.log("   Run without DRY_RUN=true to apply changes.");
  } else {
    console.log("\n✓ Migration completed successfully!");
  }

  console.log("=".repeat(60));
}

// Run migration
(async () => {
  try {
    const dryRun =
      process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    await migrateListingPhotoUrls(dryRun);
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
})();
