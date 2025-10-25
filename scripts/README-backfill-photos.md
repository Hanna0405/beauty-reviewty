# Backfill Listing Photo URLs

This script migrates existing listing photos from signed URLs to stable Firebase download URLs with persistent tokens.

## Purpose

- Fix broken listing images that use short-lived GCS v4 signed URLs
- Replace with stable Firebase download URLs that don't expire
- Ensure images continue to load after 2+ hours

## Usage

### Prerequisites

1. Ensure Firebase Admin SDK is configured with service account credentials
2. Set environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

### Running the Migration

```bash
# Install dependencies if not already done
npm install

# Run the backfill script
npx ts-node scripts/backfillListingPhotoUrls.ts
```

### What the Script Does

1. **Scans all listings** in the `listings` collection
2. **For each photo** that doesn't have a `downloadURL`:
   - Gets the file from Firebase Storage using `fullPath` or `path`
   - Generates or retrieves a `firebaseStorageDownloadTokens` value
   - Creates a stable download URL: `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}`
   - Updates the photo object with the new `downloadURL` field
3. **Updates the listing** in Firestore with the new photo data
4. **Reports progress** - shows how many listings were updated

### Safety Features

- **Idempotent**: Can be run multiple times safely
- **Non-destructive**: Only adds `downloadURL` field, doesn't remove existing data
- **Error handling**: Skips photos that can't be processed, keeps original data
- **Preserves existing fields**: Keeps `url`, `path`, `width`, `height` etc.

### Verification

After running the script:

1. **Check new uploads**: Upload a new listing photo → should contain `downloadURL` and `fullPath`
2. **Test existing listings**: Visit `localhost:3000/masters` and `localhost:3000/dashboard/master/listings`
3. **Wait 2+ hours**: Images should still load (no ExpiredToken errors)
4. **Check Firestore**: Look at a listing document - photos should have both `url` (legacy) and `downloadURL` (new)

### Troubleshooting

- **Permission errors**: Ensure service account has Storage Admin and Firestore Admin roles
- **File not found**: Some photos may reference deleted files - script will skip these
- **Network issues**: Script will retry failed operations automatically

### Rollback

If needed, you can remove the `downloadURL` fields:

```javascript
// Run in Firebase Console or via Admin SDK
db.collection("listings")
  .get()
  .then((snap) => {
    snap.docs.forEach((doc) => {
      const photos = doc.data().photos.map((p) => {
        const { downloadURL, ...rest } = p;
        return rest;
      });
      doc.ref.update({ photos });
    });
  });
```

## Technical Details

### URL Format

- **Old (signed)**: `https://storage.googleapis.com/{bucket}/{path}?X-Goog-Algorithm=...&X-Goog-Expires=...`
- **New (token)**: `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={uuid}`

### Token Persistence

The `firebaseStorageDownloadTokens` metadata is stored on the file object in Firebase Storage and persists indefinitely, making the download URL stable.

### Component Updates

The following components now prioritize `downloadURL` over `url`:

- `ListingCard.tsx` - listing thumbnails
- `ListingDetail.tsx` - gallery and thumbnails
- `ListingPhotos.tsx` - photo grid in forms
- All other photo rendering components

### Next.js Configuration

The `next.config.js` already includes the necessary domains:

- `firebasestorage.googleapis.com`
- `storage.googleapis.com`
- `beautyreviewty.firebasestorage.app`
- `beautyreviewty-dev.firebasestorage.app`
