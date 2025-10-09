# Reviews Master Subject Fix - Implementation Complete

## Summary
Fixed reviews on `/masters/[id]` pages to use `subject: { type: 'master', id }` and removed Firestore composite index requirements by sorting in JavaScript instead of orderBy queries.

---

## Changes Made

### 1. List API - Removed Composite Index Requirement
**File:** `src/app/api/reviews/list/route.ts`

**Before:**
```typescript
.where('subjectType', '==', type)
.where('subjectId', '==', id)
.orderBy('updatedAt', 'desc')  // ❌ Requires composite index
```

**After:**
```typescript
.where('subjectType', '==', type)
.where('subjectId', '==', id)
.limit(200)
.get();
// ✅ Sort in JavaScript - no composite index needed
items.sort((a, b) => {
  const au = a?.updatedAt?.seconds ?? a?.createdAt?.seconds ?? 0;
  const bu = b?.updatedAt?.seconds ?? b?.createdAt?.seconds ?? 0;
  return bu - au;
});
```

**Benefits:**
- ✅ No Firestore composite index required
- ✅ Equality filters only (subjectType + subjectId)
- ✅ Sort happens in JavaScript after fetch
- ✅ Legacy fallback still works (masterId / listingId)

---

### 2. Create API - Preserve Mirrors on Update
**File:** `src/app/api/reviews/create/route.ts`

**Before:**
```typescript
await adminDb.collection('reviews').doc(id).update(base);
```

**After:**
```typescript
const docRef = adminDb.collection('reviews').doc(id);
const prev = await docRef.get();
await docRef.update({
  ...base,  // includes subject, subjectType, subjectId
  ...(prev.get('createdAt') ? { createdAt: prev.get('createdAt') } : { createdAt: now }),
});
```

**Benefits:**
- ✅ Always preserves `createdAt` on updates
- ✅ Always updates mirror fields (subject, subjectType, subjectId)
- ✅ Consistent data structure for all reviews

---

### 3. ReviewsSection Component - Support Both Master & Listing
**File:** `src/components/ReviewsSection.tsx`

**Before:**
```typescript
export function ReviewsSection({ listingId }) {
  const subject = { type: 'listing', id: listingId };  // ❌ Always listing
```

**After:**
```typescript
export function ReviewsSection({ 
  listingId, 
  subjectType = 'listing'  // ✅ Configurable
}: { 
  listingId: string; 
  subjectType?: 'master' | 'listing' 
}) {
  const subject = { type: subjectType, id: listingId };
  console.debug('[ReviewsSection] Loading reviews for subject:', subject);
```

**Benefits:**
- ✅ Supports both master and listing reviews
- ✅ Defaults to 'listing' for backward compatibility
- ✅ Debug logging for troubleshooting

---

### 4. Master Details Page - Force Master Subject Type
**File:** `src/app/masters/[id]/ClientListing.tsx`

**Before:**
```typescript
<ReviewsSection listingId={listing.id} />  // ❌ Defaults to type: 'listing'
```

**After:**
```typescript
<ReviewsSection listingId={listing.id} subjectType="master" />  // ✅ Forces type: 'master'
```

**Benefits:**
- ✅ Reviews on `/masters/[id]` are stored with `type: 'master'`
- ✅ Creates proper subject structure: `{ type: 'master', id: listingId }`
- ✅ Both create and list use same subject type

---

### 5. Deprecated Legacy createReview
**File:** `src/lib/reviews.ts`

**Changes:**
- Added `@deprecated` JSDoc comment
- Added console warning when function is called
- Points developers to use `createReviewViaApi` instead

**Code:**
```typescript
/**
 * @deprecated Use createReviewViaApi from '@/lib/reviews/createClient' instead.
 * This function writes directly to Firestore from the client and bypasses server validation.
 * All new code should use the secure API route at /api/reviews/create.
 */
export async function createReview(payload) {
  console.warn('[createReview] DEPRECATED: Use createReviewViaApi instead');
  // ... existing implementation
}
```

---

## Data Flow

### Submit Review on /masters/[id]
```
User → ReviewsSection (subjectType="master")
     → AddReviewForm (subject: { type: 'master', id })
     → createReviewViaApi({ subject: { type: 'master', id }, ... })
     → POST /api/reviews/create
     → Firestore: reviews collection
        {
          subject: { type: 'master', id: '...' },
          subjectType: 'master',  // mirror
          subjectId: '...',       // mirror
          rating, text, photos, ...
        }
```

### Load Reviews on /masters/[id]
```
ReviewsSection (subjectType="master")
  → fetchReviews({ type: 'master', id })
  → GET /api/reviews/list?type=master&id=...
  → Firestore query:
     where('subjectType', '==', 'master')  // equality
     where('subjectId', '==', id)          // equality
     limit(200)
  → Sort in JS by updatedAt/createdAt desc
  → Display reviews
```

---

## Testing

### Master Page (/masters/[id])
1. Go to `/masters/{id}`
2. Submit a review (rating + text + photos)
3. **Expected Network Calls:**
   - POST `/api/reviews/create` → 200
   - GET `/api/reviews/list?type=master&id={id}` → 200
4. **Expected Result:**
   - Green success message
   - Review appears immediately in list
   - Console log: `[ReviewsSection] Loading reviews for subject: { type: 'master', id: '...' }`

### Listing Page (if separate)
1. Go to listing detail page
2. Submit a review
3. **Expected:**
   - Uses `type: 'listing'` (default)
   - Review saves with listing subject

---

## Firestore Index Requirements

### ✅ No Composite Index Needed
The list API now uses **equality filters only**:
- `where('subjectType', '==', type)`
- `where('subjectId', '==', id)`

**No orderBy in query** = no composite index required!

Firestore automatically creates single-field indexes for:
- `subjectType`
- `subjectId`

These are created automatically on first use.

---

## Benefits

✅ **No Composite Indexes:** Equality filters only, sort in JavaScript  
✅ **Consistent Subject:** Master pages use `type: 'master'` for all operations  
✅ **Immediate Updates:** Reviews appear instantly after submit  
✅ **Preserved createdAt:** Updates don't lose original creation timestamp  
✅ **Debug Logging:** Console logs show which subject is being used  
✅ **Backward Compatible:** Listing pages still work with `type: 'listing'`  
✅ **Legacy Fallback:** Old reviews with `masterId`/`listingId` still load  

---

## Migration Notes

### Existing Reviews
Old reviews may have:
- `masterId` field (legacy)
- `listingId` field (legacy)
- Missing `subject`, `subjectType`, `subjectId` (legacy)

**The API handles this:**
1. Tries new schema first (subjectType + subjectId)
2. Falls back to legacy (masterId / listingId)
3. Updates add new fields automatically

### No Data Migration Required
- Old reviews continue to work via legacy fallback
- New reviews automatically get proper subject structure
- Updates convert legacy reviews to new format

---

## Files Modified

- ✅ `src/app/api/reviews/list/route.ts` (removed orderBy, sort in JS)
- ✅ `src/app/api/reviews/create/route.ts` (preserve createdAt, update mirrors)
- ✅ `src/components/ReviewsSection.tsx` (configurable subjectType)
- ✅ `src/app/masters/[id]/ClientListing.tsx` (force master subject)
- ✅ `src/lib/reviews.ts` (deprecated createReview)

---

## Debug Console Logs

When submitting/loading reviews, look for:
```
[ReviewsSection] Loading reviews for subject: { type: 'master', id: 'abc123' }
[review][create] payload { subjectId: 'abc123', rating: 5, ... }
[review][ok] Review submitted successfully
```

If you see `type: 'listing'` on a master page, check that `subjectType="master"` prop is passed to `ReviewsSection`.

---

## Next Steps (Optional)

1. **Data Backfill:** Run script to add subject mirrors to old reviews
2. **Remove Legacy Fallback:** Once all reviews have new schema
3. **Add Indexes:** If query performance degrades with 200+ reviews per subject
4. **Pagination:** Add cursor-based pagination for subjects with many reviews

---

## Rollback Plan

If issues arise:
1. Remove `subjectType="master"` from `ClientListing.tsx`
2. Reviews will default back to `type: 'listing'`
3. Existing reviews with `type: 'master'` won't show (but won't break)

---

## Questions?

Check the browser console for:
- `[ReviewsSection] Loading reviews for subject:` - shows which subject is being used
- Network tab for API calls and responses
- Firestore console to verify review documents have correct subject structure

