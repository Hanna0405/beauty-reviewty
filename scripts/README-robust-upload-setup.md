# Robust Upload System Setup

This guide helps you set up the bulletproof upload system that works regardless of CORS issues.

## 🚀 Quick Setup

### Step 1: Environment Variables

Create/update your `.env.local` file:

```env
# Client SDK (existing)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Admin SDK (for fallback uploads)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Step 2: Deploy Security Rules

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
firebase deploy --only firestore:rules,storage
```

### Step 3: Test the System

1. **Start dev server**: `npm run dev`
2. **Open browser console** to see debug logs
3. **Sign in** to your app
4. **Create a new listing** with photos
5. **Check console** for `[BR]` debug messages

## 🔧 How It Works

### Upload Flow
1. **Client SDK First**: Tries Firebase client SDK (fast path)
2. **CORS Detection**: If CORS blocks, automatically detects the error
3. **Server Fallback**: Uses `/api/upload` route with Firebase Admin SDK
4. **Same Result**: Returns valid download URL regardless of method

### Debug Logging
Look for these console messages:
- `[BR][Upload] Client SDK OK:` - Client upload succeeded
- `[BR][Upload] SDK CORS blocked, falling back:` - Using fallback
- `[BR][Upload] Fallback OK:` - Server upload succeeded
- `[BR][NewListing] Saving to Firestore:` - Listing save attempt
- `[BR][NewListing] Saved successfully:` - Listing saved

## 🛠️ Files Created/Updated

### Core Infrastructure
- `src/lib/firebase-admin.ts` - Firebase Admin SDK setup
- `src/app/api/upload/route.ts` - Server-side upload API
- `src/lib/uploader.ts` - Universal uploader with fallback

### Security Rules
- `firestore.rules` - Simplified Firestore rules using `ownerUid`
- `storage.rules` - Storage rules for uploads

### Components (Already Updated)
- `src/components/ListingPhotos.tsx` - Uses new uploader
- `src/components/AvatarUploader.tsx` - Uses new uploader
- `src/app/dashboard/master/listings/new/page.tsx` - Uses `ownerUid`
- `src/app/dashboard/master/listings/[id]/edit/page.tsx` - Uses `ownerUid`

## 🧪 Testing Checklist

### ✅ Upload System
- [ ] Client SDK uploads work (no CORS errors)
- [ ] Fallback API works when client SDK fails
- [ ] Photos appear in Firebase Console → Storage
- [ ] Download URLs are valid and accessible
- [ ] Progress indicators work during upload

### ✅ Firestore Permissions
- [ ] Can create new listing (no "Missing permissions" error)
- [ ] Can update existing listing
- [ ] Can read own listings
- [ ] Cannot access other users' listings

### ✅ Debug Logging
- [ ] See `[BR]` messages in console
- [ ] Upload paths are logged
- [ ] Save operations are logged
- [ ] Error messages are clear

## 🚨 Troubleshooting

### "Missing or insufficient permissions"
1. **Check user is signed in**: `auth.currentUser` must exist
2. **Verify rules deployed**: Check Firebase Console → Firestore → Rules
3. **Check field names**: Ensure `ownerUid` is set (not `ownerId`)
4. **Check user ID**: Must match the authenticated user

### Upload failures
1. **Check environment variables**: All required vars set in `.env.local`
2. **Check service account**: Admin SDK credentials valid
3. **Check file paths**: Must match `profiles/<uid>/**` or `listings/<uid>/**`
4. **Check console logs**: Look for `[BR]` debug messages

### CORS errors
1. **Expected behavior**: Client SDK may fail with CORS
2. **Automatic fallback**: System should use server API automatically
3. **Check fallback logs**: Look for "Fallback OK" messages
4. **No user impact**: Uploads should complete regardless

## 📱 Production Deployment

When deploying to production:

1. **Set environment variables** in your deployment platform
2. **Deploy rules to production**:
   ```bash
   firebase use production
   firebase deploy --only firestore:rules,storage
   ```
3. **Test uploads** on production domain
4. **Monitor logs** for any issues

## 🔐 Security Notes

- **Service account keys** are only used server-side
- **Client uploads** use Firebase Auth for permissions
- **Storage rules** restrict access to user's own files
- **Firestore rules** ensure users can only manage their own listings

## 🎯 Expected Behavior

### Successful Upload
```
[BR][Upload] Client SDK OK: listings/user123/listing456/photo.jpg
```

### CORS Fallback
```
[BR][Upload] SDK CORS blocked, falling back: CORS policy...
[BR][Upload] Fallback OK: listings/user123/listing456/photo.jpg
```

### Successful Save
```
[BR][NewListing] Saving to Firestore: {id: "abc123", ownerUid: "user123", photosCount: 3}
[BR][NewListing] Saved successfully: abc123
```

The system is now bulletproof and will work regardless of CORS configuration!
