# Listing Photo URL Migration Script

## Overview
This script migrates existing listing photo URLs from signed Google Cloud URLs (containing `GoogleAccessId` or `X-Goog-*`) to proper Firebase Storage download URLs.

## Problem
Some listing photos were saved with signed URLs that expire and break in the browser. This script fixes them by:
1. Detecting signed URLs in listing documents
2. Extracting the storage object path from signed URLs
3. Generating proper Firebase Storage download URLs
4. Updating the listing documents

## What it does
- Scans all documents in the `listings` collection
- Detects photos with signed URLs (containing `GoogleAccessId=` or `X-Goog-Algorithm=`)
- Extracts storage paths from signed URLs
- Generates proper download URLs using Firebase Admin SDK
- Updates listing documents with fixed photo URLs
- Preserves photo order and other photo metadata
- Provides detailed logging and statistics

## Usage

### Prerequisites
Set Firebase Admin SDK environment variables (same as your main app):
```bash
# Production
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-service-account-email"
export FIREBASE_PRIVATE_KEY="your-private-key"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-bucket-name"

# Or for development
export FIREBASE_PROJECT_ID_DEV="your-dev-project-id"
export FIREBASE_CLIENT_EMAIL_DEV="your-dev-service-account-email"
export FIREBASE_PRIVATE_KEY_DEV="your-dev-private-key"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV="your-dev-bucket-name"
```

### Dry-Run (Recommended First Step)
Test the migration without making any changes:
```bash
DRY_RUN=true npx tsx scripts/migrate-listing-photo-urls.ts
```

This will:
- Scan all listings
- Identify photos with signed URLs
- Show what would be changed
- **NOT** modify any documents

### Execute Migration
Once you've verified the dry-run output, run the actual migration:
```bash
npx tsx scripts/migrate-listing-photo-urls.ts
```

Or explicitly set DRY_RUN to false:
```bash
DRY_RUN=false npx tsx scripts/migrate-listing-photo-urls.ts
```

## Output
The script provides detailed logging:
- Progress for each listing processed
- Which photos were fixed
- Any errors encountered
- Final summary with statistics:
  - Total listings processed
  - Listings with signed URLs
  - Total photos processed
  - Photos fixed
  - Photos skipped (no signed URLs)
  - Errors encountered

## Safety
- **Dry-run mode**: Always test first with `DRY_RUN=true`
- **Idempotent**: Safe to run multiple times (skips already-fixed photos)
- **Preserves data**: Only updates photo URLs, keeps all other fields intact
- **Error handling**: Continues processing even if individual photos fail
- **Detailed logging**: All operations are logged for transparency

## Photo URL Fields Supported
The script checks these fields for signed URLs:
- `url`
- `downloadURL`
- `src`

## Signed URL Patterns Detected
- URLs containing `GoogleAccessId=`
- URLs containing `X-Goog-Algorithm=`
- URLs containing `X-Goog-Signature=`

## Generated URLs
The script generates proper Firebase Storage download URLs in the format:
```
https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/ENCODED_PATH?alt=media&token=TOKEN
```

## Troubleshooting

### Permission Errors
- Ensure your Firebase Admin SDK credentials are correct
- Verify the service account has Firestore write permissions
- Verify the service account has Storage read/write permissions

### Missing Files
- If a storage path doesn't exist, the photo will be skipped
- Check the logs for warnings about missing files

### Could Not Extract Path
- Some signed URLs may have unusual formats
- The script will log warnings and skip those photos
- You may need to manually fix those cases

### TypeScript/tsx Not Found
Install tsx if needed:
```bash
npm install -g tsx
# or
npx tsx --version
```

## After Migration
1. Verify a few listings in the Firebase Console to ensure URLs are correct
2. Test image loading in the app
3. Monitor for any broken images
4. The new upload code (using client SDK) will prevent this issue from recurring

## Related Files
- `src/lib/upload-client.ts` - Client-side upload function (prevents future signed URLs)
- `src/lib/firestore-listings.ts` - Firestore listing functions with signed URL safeguards
- `src/components/ListingPhotos.tsx` - Photo upload component
