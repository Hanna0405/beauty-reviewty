# Reviews Listing Subject Fix - /masters/[id]

## Summary
Fixed reviews on `/masters/[id]` pages to correctly attach to the **LISTING** with `subject: { type: 'listing', id: routeId }`.

---

## The Issue
The route `/masters/[id]` displays a listing detail page where `[id]` is a **listing ID** from the `listings` collection. Reviews must be attached to that specific listing, not to a master profile.

---

## The Fix

### 1. Master Details Page
**File:** `src/app/masters/[id]/ClientListing.tsx`

**Change:**
```typescript
// ✅ Explicitly set subjectType to 'listing'
<ReviewsSection listingId={listing.id} subjectType="listing" />
```

**Result:**
- Reviews on `/masters/[id]` use `subject: { type: 'listing', id: listing.id }`
- The `listing.id` comes from the route parameter `[id]`

### 2. Reviews Section Component
**File:** `src/components/ReviewsSection.tsx`

**Changes:**
```typescript
// Subject construction
const subject = { type: subjectType as const, id: String(listingId) };

// Debug logging for troubleshooting
console.debug('[Reviews] /masters page subject →', subject);

// Create review with explicit rating conversion
await createReviewViaApi({
  subject,
  rating: Number(rating),
  text: text.trim(),
  photos,
});
```

**Debug Logs Added:**
- `[Reviews] /masters page subject →` - Shows subject when loading reviews
- `[Reviews] Creating review with subject →` - Shows subject when submitting review

---

## Data Flow on /masters/[id]

### Route Structure
```
URL: /masters/abc123
     └─ abc123 = listing ID (from listings collection)
```

### Subject Used
```typescript
{
  type: 'listing',
  id: 'abc123'  // the listing ID from the route
}
```

### Submit Review
```
User → ReviewsSection(listingId="abc123", subjectType="listing")
     → subject = { type: 'listing', id: 'abc123' }
     → createReviewViaApi({ subject, ... })
     → POST /api/reviews/create
     → Firestore: {
         subject: { type: 'listing', id: 'abc123' },
         subjectType: 'listing',
         subjectId: 'abc123',
         ...
       }
```

### Load Reviews
```
ReviewsSection
  → subject = { type: 'listing', id: 'abc123' }
  → fetchReviews(subject)
  → GET /api/reviews/list?type=listing&id=abc123
  → Firestore query:
     where('subjectType', '==', 'listing')
     where('subjectId', '==', 'abc123')
  → Display reviews for this listing
```

---

## Testing on /masters/[id]

### 1. Navigate to Page
```
Go to: /masters/{any-listing-id}
```

### 2. Submit Review
1. Fill out review form (rating + text + optional photos)
2. Click "Add review"

### 3. Expected Console Logs
```
[Reviews] Creating review with subject → { type: 'listing', id: 'abc123' }
[review][ok] Review submitted successfully
[Reviews] /masters page subject → { type: 'listing', id: 'abc123' }
```

### 4. Expected Network Calls
```
POST /api/reviews/create
  Body: {
    subject: { type: 'listing', id: 'abc123' },
    rating: 5,
    text: '...',
    photos: [...]
  }
  Response: { ok: true, id: 'review-id' }

GET /api/reviews/list?type=listing&id=abc123
  Response: {
    ok: true,
    items: [
      {
        id: 'review-id',
        subject: { type: 'listing', id: 'abc123' },
        subjectType: 'listing',
        subjectId: 'abc123',
        rating: 5,
        text: '...',
        ...
      }
    ]
  }
```

### 5. Expected UI
- ✅ Green success message: "Your review was added successfully."
- ✅ Review appears immediately in the list
- ✅ No page reload required

---

## Verification Checklist

On `/masters/[id]`:

- [ ] Console shows `subject → { type: 'listing', id: '...' }` (not 'master')
- [ ] POST to `/api/reviews/create` includes `subject.type: 'listing'`
- [ ] GET to `/api/reviews/list` uses `type=listing&id=...`
- [ ] Review saves to Firestore with `subjectType: 'listing'`
- [ ] Review appears immediately after submit
- [ ] Refresh page - review still shows

---

## Files Modified

- ✅ `src/app/masters/[id]/ClientListing.tsx` - Pass `subjectType="listing"`
- ✅ `src/components/ReviewsSection.tsx` - Add debug logs, ensure subject consistency

---

## Why type: 'listing' and not 'master'?

The route `/masters/[id]` is a bit of a misnomer:
- The URL path starts with `/masters/` for SEO/UX reasons
- But the `[id]` parameter is a **listing ID** from the `listings` collection
- The page loads `doc(db, 'listings', id)` to display the listing
- Therefore, reviews must be attached to that listing, not to a master profile

### Data Model
```
listings/{listingId}
  ├─ title, city, services, etc.
  └─ reviews (attached via subject)
       └─ subject: { type: 'listing', id: listingId }
```

---

## No API Changes Required

The APIs (`/api/reviews/create` and `/api/reviews/list`) already support both types:
- `type: 'master'` - for master profiles
- `type: 'listing'` - for listings

This fix just ensures the correct type is used on the `/masters/[id]` route.

---

## Backward Compatibility

Old reviews may exist with different structures:
- Legacy `masterId` field
- Legacy `listingId` field
- Missing `subject` structure

**The API handles this:**
- New schema query tries first
- Legacy fallback if no results
- All new reviews use proper subject structure

---

## Questions?

Check browser console:
1. Look for `[Reviews] /masters page subject →` log
2. Verify it shows `{ type: 'listing', id: '...' }`
3. Check Network tab for API calls
4. Inspect Firestore to verify review doc structure

If you see `type: 'master'` in the logs, the `subjectType` prop is not being passed correctly.

