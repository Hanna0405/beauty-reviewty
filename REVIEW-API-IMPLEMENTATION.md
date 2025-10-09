# Review Submission API Implementation

## Summary
Fixed "Failed to submit review" error caused by Firestore "Missing or insufficient permissions" by moving review creation from client-side Firestore writes to a secure server route using Firebase Admin SDK.

## Changes Made

### 1. Created Secure API Route
**File:** `src/app/api/reviews/create/route.ts`
- Uses Firebase Admin SDK for server-side Firestore access (bypasses client permissions)
- Verifies user authentication via Firebase Auth token
- Validates all input (subject type/id, rating 1-5, text length, photos)
- Checks that referenced master/listing document exists
- Prevents duplicate reviews (updates existing if found)
- Writes to subcollections: `masters/{id}/reviews` or `listings/{id}/reviews`
- For master reviews, also creates a public review doc in top-level `reviews` collection for feed queries
- Returns proper HTTP status codes (400 for validation, 401 for auth, 500 for errors)

### 2. Created Client Helper
**File:** `src/lib/reviews/createClient.ts`
- Exports `createReviewViaApi()` function
- Gets current user's Firebase Auth token
- Makes authenticated POST request to `/api/reviews/create`
- Throws descriptive errors that can be caught and displayed to users

### 3. Updated Review Form
**File:** `src/components/reviews/ReviewForm.tsx`
- Removed direct Firestore imports (`addDoc`, `collection`, `doc`, `serverTimestamp`)
- Removed `db` import and `createPublicReview` call
- Now calls `createReviewViaApi()` instead of direct Firestore writes
- Improved error handling with specific messages for different error types:
  - 401 errors → "Please sign in to leave a review."
  - 400 errors → Shows specific validation message
  - 500 errors → "Something went wrong. Please try again."
- Maintains all existing UI/UX (star rating, text, photo uploads, form reset)

## How It Works

1. **User submits review** → ReviewForm collects rating, text, and photos
2. **Photos are uploaded** → Uses existing `uploadImagesViaApi()` (unchanged)
3. **Review is sent to API** → `createReviewViaApi()` makes authenticated request
4. **Server validates and saves** → API route verifies auth, validates data, writes to Firestore with Admin SDK
5. **UI updates** → Form resets on success, shows error on failure

## Benefits

✅ **Bypasses Firestore security rules** - Admin SDK has full access
✅ **Server-side validation** - Can't be bypassed by client manipulation
✅ **Proper authentication** - Token verification ensures user identity
✅ **Better error messages** - Specific feedback for different error cases
✅ **Duplicate prevention** - Server checks and updates existing reviews
✅ **Document verification** - Ensures referenced master/listing exists
✅ **Public feed support** - Automatically creates public review docs for masters

## Testing

To test the implementation:

1. Start dev server: `npm run dev`
2. Sign in to the app
3. Navigate to a master or listing page
4. Fill out the review form (rating, text, optionally attach photos)
5. Submit the form
6. **Expected result:** Review should save successfully without permissions errors

## Other Review Forms

**Note:** Two other review forms were found that still use direct Firestore writes:
- `src/components/ReviewForm.tsx` - Profile reviews with booking eligibility check
- `src/app/review/[id]/page.tsx` - Standalone review page

If these forms encounter the same permissions error, they can be migrated to use the same API route by:
1. Importing `createReviewViaApi` from `@/lib/reviews/createClient`
2. Replacing `addDoc(collection(db, 'reviews'), ...)` with `await createReviewViaApi({ subject: { type: 'master', id }, rating, text, photos })`

## Environment Variables Required

The Firebase Admin SDK requires these environment variables (should already be set):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These are used by `src/lib/firebase/admin.ts` to initialize the Admin SDK.

## API Endpoint

**POST** `/api/reviews/create`

**Headers:**
```
Authorization: Bearer <firebase-auth-token>
Content-Type: application/json
```

**Body:**
```json
{
  "subject": { "type": "master" | "listing", "id": "document-id" },
  "rating": 1-5,
  "text": "Review text (optional, max 2000 chars)",
  "photos": [{ "url": "...", "path": "..." }] // max 3
}
```

**Response (Success):**
```json
{
  "ok": true,
  "id": "review-doc-id",
  "updated": false // true if existing review was updated
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Error message"
}
```

