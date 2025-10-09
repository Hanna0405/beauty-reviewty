# Reviews List API - Implementation Complete

## Summary
Wired up reviews list to the new subject-based schema with `/api/reviews/list` endpoint. Reviews now load from the API and show success/error messages after submission.

---

## Changes Made

### 1. Shared Types
**File:** `src/lib/reviews/types.ts`
- `ReviewPhoto` - Photo metadata
- `ReviewSubject` - Subject reference (type + id)
- `ReviewDoc` - Complete review document structure

### 2. List API Endpoint
**File:** `src/app/api/reviews/list/route.ts`
- **Method:** GET
- **Query params:** `type` (master|listing), `id` (subject id)
- **Features:**
  - Uses Firebase Admin SDK (no auth required for reading public reviews)
  - Tries new schema first (`subjectType` + `subjectId`)
  - Falls back to legacy fields (`masterId` / `listingId`) for backward compatibility
  - Returns up to 100 reviews, ordered by `updatedAt` desc
  - Proper error handling with status codes

**Endpoint:**
```
GET /api/reviews/list?type=master&id=abc123
GET /api/reviews/list?type=listing&id=xyz789
```

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": "review-id",
      "subject": { "type": "master", "id": "abc123" },
      "subjectType": "master",
      "subjectId": "abc123",
      "authorUid": "user-uid",
      "rating": 5,
      "text": "Great service!",
      "photos": [{ "url": "...", "path": "..." }],
      "createdAt": { "seconds": 1234567890 },
      "updatedAt": { "seconds": 1234567890 }
    }
  ]
}
```

### 3. Client Fetch Helper
**File:** `src/lib/reviews/fetchList.ts`
- `fetchReviews(subject)` - Fetches reviews for a given subject
- Uses `cache: 'no-store'` to always get fresh data
- Returns array of `ReviewDoc`

### 4. Updated Components

#### ✅ ReviewsSection (for listing pages)
**File:** `src/components/ReviewsSection.tsx`
- **Before:** Used Firestore `onSnapshot` listener
- **After:** Uses `fetchReviews()` API
- Shows loading state while fetching
- **Success message:** "Your review was added successfully."
- **Error messages:** Specific messages for different error types
- Refetches reviews after successful submission
- Delete button also refetches reviews

#### ✅ ReviewList (for master pages)
**File:** `src/components/reviews/ReviewList.tsx`
- **Before:** Used Firestore `onSnapshot` listener
- **After:** Uses `fetchReviews()` API
- Shows loading state while fetching
- Refetches reviews after deletion

#### ✅ ReviewForm (generic form)
**File:** `src/components/reviews/ReviewForm.tsx`
- Added success/error message states
- **Success message:** "Your review was added successfully." (green)
- **Error messages:** Specific messages (red):
  - "Please sign in to leave a review."
  - "Invalid subject: ..." (validation errors)
  - "Text too long (max 2000)."
  - "Something went wrong. Please try again."
- Calls `onSubmitted()` callback to trigger parent refresh
- Replaced `alert()` with inline messages

#### ✅ Community Master Page
**File:** `src/app/reviewty/m/[slug]/page.tsx`
- Added `reviewKey` state to force ReviewList re-render
- Added `handleReviewSubmitted` callback
- Passes callback to `ReviewForm`
- Passes `key={reviewKey}` to `ReviewList` to trigger reload

---

## Flow

### Submit Review
1. User fills out form (rating, text, photos)
2. Photos uploaded via existing API
3. Review submitted via `createReviewViaApi()`
4. **Success:** 
   - Form resets
   - Green message: "Your review was added successfully."
   - Calls `onSubmitted()` callback
   - Parent component refetches reviews
5. **Error:**
   - Red message with specific error
   - Form stays filled for retry

### View Reviews
1. Component mounts
2. Shows "Loading reviews..." spinner
3. Fetches via `/api/reviews/list`
4. Displays reviews with stars, text, photos
5. User can delete their own reviews (refetches after)

---

## Benefits

✅ **Unified Schema:** All reviews in top-level `reviews` collection  
✅ **Backward Compatible:** Falls back to legacy fields  
✅ **No Realtime Listeners:** Reduces Firestore read costs  
✅ **Better UX:** Loading states + success/error messages  
✅ **Consistent:** Same API for masters and listings  
✅ **Type Safe:** Shared TypeScript types  

---

## Testing

### Listing Page
1. Go to `/masters/{id}` (listing detail page)
2. See existing reviews load
3. Submit a new review
4. **Expected:** Green success message, list refreshes with new review

### Master Page (Reviewty)
1. Go to `/reviewty/m/{slug}`
2. See existing reviews load
3. Submit a new review
4. **Expected:** Green success message, list refreshes with new review

### Error Cases
1. Submit without signing in → "Please sign in to leave a review."
2. Submit text > 2000 chars → "Text too long (max 2000)."
3. Network error → "Something went wrong. Please try again."

---

## Data Structure

Reviews are now stored in the top-level `reviews` collection:

```typescript
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

### Firestore Queries
```typescript
// New schema
where('subjectType', '==', 'master')
where('subjectId', '==', masterId)

// Legacy fallback
where('masterId', '==', masterId)  // for master reviews
where('listingId', '==', listingId)  // for listing reviews
```

---

## Legacy Components

The following components still exist but are not updated (not actively used):
- `src/components/ReviewForm.tsx` (booking-based reviews)
- `src/app/review/[id]/page.tsx` (standalone review page)

These already use `createReviewViaApi()` from the previous migration, so they write correctly. If they need to display reviews, they can use the same `fetchReviews()` helper.

---

## Next Steps (Optional)

1. **Add Pagination:** Limit 100 reviews might not be enough for popular masters
2. **Add Sorting:** Allow users to sort by newest/highest rated
3. **Add Filtering:** Filter by rating (5-star only, 4+ stars, etc.)
4. **Add Review Editing:** Allow users to edit their own reviews
5. **Add Review Reactions:** Helpful/Not helpful buttons
6. **Add Moderation:** Admin queue for approving/rejecting reviews

---

## Files Modified

- ✅ `src/lib/reviews/types.ts` (created)
- ✅ `src/app/api/reviews/list/route.ts` (created)
- ✅ `src/lib/reviews/fetchList.ts` (created)
- ✅ `src/lib/reviews/createClient.ts` (updated imports)
- ✅ `src/components/ReviewsSection.tsx` (updated to use API)
- ✅ `src/components/reviews/ReviewList.tsx` (updated to use API)
- ✅ `src/components/reviews/ReviewForm.tsx` (added success/error messages)
- ✅ `src/app/reviewty/m/[slug]/page.tsx` (added refresh callback)

---

## No Breaking Changes

All existing functionality preserved:
- Reviews still display on listing pages
- Reviews still display on master pages
- Users can still delete their own reviews
- Star ratings still calculate correctly
- Photos still display correctly

The only difference is:
- ✅ Reviews load via API instead of Firestore listeners
- ✅ Success/error messages show inline instead of alerts
- ✅ List refreshes automatically after submit/delete

