# Review API Implementation - Complete Migration

## Summary
All review submission flows now use the secure `/api/reviews/create` endpoint with Firebase Admin SDK. Client-side Firestore writes to the `reviews` collection have been eliminated.

---

## 1. Firebase Admin Initializer Enhanced

**File:** `src/lib/firebase/admin.ts`

**Changes:**
- Added support for `FIREBASE_SERVICE_ACCOUNT_KEY` env var (full JSON, for Vercel)
- Maintained backward compatibility with individual env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- Added `applicationDefault()` fallback for local development
- Normalized exports: `adminDb`, `adminAuth`

**Environment Variables (pick one strategy):**
1. **Vercel/Production:** Set `FIREBASE_SERVICE_ACCOUNT_KEY` to the full service account JSON
2. **Legacy/Local:** Use individual vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
3. **Local Dev:** Use `applicationDefault()` with gcloud auth

---

## 2. Secure API Route

**File:** `src/app/api/reviews/create/route.ts`

**Features:**
- Verifies Firebase Auth token (Authorization: Bearer header)
- Validates all inputs (rating 1-5, text max 2000 chars, max 3 photos)
- Checks that referenced master/listing exists in `profiles/{id}` or `listings/{id}`
- Prevents duplicate reviews (one per author + subject)
- Writes to top-level `reviews` collection with structured `subject` field
- Returns proper HTTP status codes:
  - 200: Success
  - 400: Validation error
  - 401: Auth error
  - 500: Server error

**Payload:**
```json
{
  "subject": { "type": "master"|"listing", "id": "doc-id" },
  "rating": 1-5,
  "text": "Review text...",
  "photos": [{ "url": "...", "path": "..." }]
}
```

**Response:**
```json
{
  "ok": true,
  "id": "review-doc-id",
  "updated": false
}
```

---

## 3. Client Helper

**File:** `src/lib/reviews/createClient.ts`

**Exports:**
- `createReviewViaApi(input)` - Single function for all review submissions
- `ReviewPhoto` type
- `ReviewSubject` type

**Usage:**
```ts
import { createReviewViaApi } from '@/lib/reviews/createClient';

await createReviewViaApi({
  subject: { type: 'master', id: masterId },
  rating: 5,
  text: 'Great service!',
  photos: [{ url: '...', path: '...' }]
});
```

---

## 4. Updated Components

### ✅ src/components/reviews/ReviewForm.tsx
- **Status:** Fully migrated
- **Subject:** `{ type: subjectType, id: subjectId }` (passed as prop)
- **Usage:** Master and listing review forms

### ✅ src/components/ReviewForm.tsx
- **Status:** Fully migrated
- **Subject:** `{ type: 'master', id: profileId }`
- **Usage:** Profile reviews with booking eligibility check
- **Note:** Only allows reviews after completed bookings

### ✅ src/app/review/[id]/page.tsx
- **Status:** Fully migrated
- **Subject:** `{ type: 'master', id: params.id }`
- **Usage:** Standalone review page

### ✅ src/components/ReviewsSection.tsx
- **Status:** Fully migrated
- **Subject:** `{ type: 'listing', id: listingId }`
- **Usage:** Reviews section on listing pages

### ⚠️ src/app/reviewty/ReviewtyCreateModal.tsx
- **Status:** Partially migrated
- **Listing mode:** Uses API (`{ type: 'listing', id: listingId }`)
- **Community mode:** Blocked with alert (community_masters not in profiles collection)
- **Note:** Community reviews require integration with profiles collection

---

## 5. Error Handling

All components now provide user-friendly error messages:

| Error Type | User Message |
|-----------|-------------|
| 401 / "sign in" | "Please sign in to leave a review." |
| 400 / validation | Shows specific error (e.g., "Text too long (max 2000).") |
| 500 / server | "Something went wrong. Please try again." |
| Network error | Error message from API |

---

## 6. Removed Patterns

The following patterns have been eliminated:

### ❌ Direct client writes
```ts
// OLD - NO LONGER USED
await addDoc(collection(db, 'reviews'), { ... });
await setDoc(doc(db, 'reviews', id), { ... });
```

### ❌ Legacy createReview function
```ts
// src/lib/reviews.ts - createReview() function is deprecated
// All calls replaced with createReviewViaApi()
```

### ❌ Subcollection writes
```ts
// OLD - NO LONGER USED
collection(doc(db, 'masters', id), 'reviews')
```

---

## 7. Data Structure

### New Review Document (in `reviews` collection)
```ts
{
  subject: { type: 'master'|'listing', id: string },
  subjectType: 'master'|'listing',  // denormalized for queries
  subjectId: string,                // denormalized for queries
  authorUid: string,
  rating: 1-5,
  text: string,
  photos: [{ url: string, path: string }],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Queries
```ts
// Find reviews for a master
where('subject.type', '==', 'master')
where('subject.id', '==', masterId)

// Find reviews by author
where('authorUid', '==', uid)
```

---

## 8. Testing

### Local Development
1. Start dev server: `npm run dev`
2. Sign in to the app
3. Navigate to a master or listing page
4. Fill out review form (rating, text, photos)
5. Submit
6. **Expected:** Review saves without permissions errors

### Network Inspection
- Should see **one** POST request: `/api/reviews/create` → 200
- Should **not** see any `firestore.googleapis.com` write requests from the browser

### Console Logs
```
[review][create] payload { subjectId: '...', rating: 5, ... }
[review][ok] Review submitted successfully
```

---

## 9. Deployment Checklist

### Vercel Environment Variables
Add these to your Vercel project settings:

**Option 1: Service Account JSON (Recommended)**
```
FIREBASE_SERVICE_ACCOUNT_KEY={...full JSON from Firebase Console...}
```

**Option 2: Individual Variables**
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### Firestore Rules (No Changes Required)
The API route uses Admin SDK which bypasses security rules. Your existing rules remain unchanged.

### Firestore Indexes
If querying by `subject.type` + `subject.id`, create composite index:
```
Collection: reviews
Fields:
  - subject.type (Ascending)
  - subject.id (Ascending)
  - createdAt (Descending)
```

---

## 10. Benefits

✅ **Security:** All writes use Firebase Admin SDK (bypasses client rules)  
✅ **Validation:** Server-side validation prevents malicious input  
✅ **Authentication:** Token verification ensures user identity  
✅ **Duplicate Prevention:** Automatically prevents duplicate reviews  
✅ **Better Errors:** User-friendly error messages for all scenarios  
✅ **Consistency:** Single API endpoint for all review types  
✅ **Maintainability:** All review logic in one place  

---

## 11. Known Limitations

⚠️ **Community Reviews** (`reviewty` page, community mode)
- Currently blocked with user-facing alert
- Requires community_masters to be integrated into profiles collection
- Alternative: Add API support for community_masters separately

---

## 12. Rollback Plan

If issues arise, you can temporarily revert by:
1. Restoring `src/lib/reviews.ts` `createReview()` function
2. Reverting component imports back to `createReview`
3. Updating Firestore rules to allow client writes to `reviews` collection

However, this is **not recommended** as it reintroduces the permissions vulnerability.

---

## 13. Next Steps (Optional)

1. **Community Reviews:** Add API support for `community_masters` or migrate to `profiles`
2. **Review Analytics:** Add server-side analytics to the API route
3. **Rate Limiting:** Add rate limiting to prevent spam reviews
4. **Email Notifications:** Send email to master when they receive a review
5. **Moderation Queue:** Add admin moderation before reviews go live
6. **Review Reactions:** Add helpful/report buttons with separate API endpoints

---

## Questions?

Check the console logs when submitting a review. The API route logs all errors to the server console, which you can view in Vercel logs or your local terminal.

