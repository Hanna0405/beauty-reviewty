# Firebase Permissions & Storage Fix

This guide helps you fix the "Missing or insufficient permissions" error and ensure photo uploads work correctly.

## 🔧 Files Created

1. **`firestore.rules`** - Firestore security rules
2. **`storage.rules`** - Storage security rules  
3. **`scripts/deploy-rules.sh`** - Unix/Mac deployment script
4. **`scripts/deploy-rules.ps1`** - Windows deployment script

## 🚀 Quick Fix Commands

### Step 1: Deploy Security Rules

**Windows (PowerShell):**
```powershell
.\scripts\deploy-rules.ps1
```

**Unix/Mac/Linux:**
```bash
chmod +x scripts/deploy-rules.sh
./scripts/deploy-rules.sh
```

**Manual deployment:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Step 2: Verify Environment Variables

Ensure your `.env.local` has:
```env
# Client SDK (existing)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Admin SDK (for fallback uploads)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Step 3: Test the Fix

1. **Start your dev server**: `npm run dev`
2. **Sign in** to your app (Firebase Auth required)
3. **Create a new listing** - should succeed without permission errors
4. **Upload photos** - should work via client SDK or fallback API
5. **Check console** - no red CORS/permission errors

## 🔒 Security Rules Explained

### Firestore Rules
- **Users**: Public read, owner can write
- **Listings**: Public read for published, owner can manage all
- **Required fields**: `title`, `city`, `services`, `languages`, `ownerUid`, `createdAt`, `updatedAt`

### Storage Rules
- **Avatars**: `profiles/<uid>/**` - owner can write, public read
- **Listing photos**: `listings/<uid>/**` - owner can write, public read
- **Everything else**: Blocked by default

## 🛠️ Code Changes Made

### Listing Creation/Update
- Added `ownerUid: user.uid` (required by rules)
- Ensured all required fields are present
- Proper timestamps with `serverTimestamp()`

### Upload System
- Client SDK first (fast path)
- Automatic fallback to server-side API for CORS issues
- Same download URL format regardless of upload method

## 🧪 Testing Checklist

### ✅ Firestore Permissions
- [ ] Can create new listing (no "Missing permissions" error)
- [ ] Can update existing listing
- [ ] Can read own listings
- [ ] Cannot access other users' listings

### ✅ Storage Uploads
- [ ] Avatar uploads work
- [ ] Listing photo uploads work
- [ ] Photos appear in Firebase Console → Storage
- [ ] Download URLs are valid and accessible

### ✅ CORS Handling
- [ ] No red CORS errors in DevTools Network tab
- [ ] Uploads complete successfully
- [ ] Fallback API works if client SDK fails

## 🚨 Troubleshooting

### "Missing or insufficient permissions"
1. **Check user is signed in**: `auth.currentUser` must exist
2. **Verify rules deployed**: Check Firebase Console → Firestore → Rules
3. **Check required fields**: Ensure `ownerUid` is set correctly
4. **Check field types**: `services` and `languages` must be arrays

### Upload failures
1. **Check Storage rules**: Verify deployed in Firebase Console → Storage → Rules
2. **Check CORS**: Use fallback API if client SDK fails
3. **Check file paths**: Must match `profiles/<uid>/**` or `listings/<uid>/**`
4. **Check file size**: Max 8MB per file

### Environment issues
1. **Check .env.local**: All required variables set
2. **Check Firebase project**: Must match your actual project
3. **Check service account**: Admin SDK credentials valid

## 📱 Production Deployment

When deploying to production:

1. **Deploy rules to production**:
   ```bash
   firebase use production
   firebase deploy --only firestore:rules,storage
   ```

2. **Set environment variables** in your deployment platform (Vercel, etc.)

3. **Test uploads** on production domain

4. **Monitor logs** for any permission or upload errors

## 🔐 Security Notes

- **Never commit** service account keys to version control
- **Use environment variables** for all sensitive data
- **Rules are restrictive by default** - only allow what's needed
- **Test thoroughly** before deploying to production

The system now has proper permissions and bulletproof upload handling!
