# Firebase Storage CORS Configuration

This guide helps you fix CORS errors when uploading files to Firebase Storage from your local development environment and production.

## Prerequisites

1. **Verify your bucket name** in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<BUCKET_FROM_LOG>
   ```
   Check the browser console for: `[BR][Storage] Using bucket: <bucket-name>`

2. **Install Google Cloud CLI** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use package manager: `brew install google-cloud-sdk` (macOS)

## Step-by-Step Commands

### 1. Authenticate and Set Project
```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
```

### 2. Apply CORS Configuration
Choose **ONE** of the following methods:

**Option A: New gcloud storage command (recommended):**
```bash
gcloud storage buckets update gs://<BUCKET_FROM_LOG> --cors-file=scripts/storage-cors.json
```

**Option B: Legacy gsutil command:**
```bash
gsutil cors set scripts/storage-cors.json gs://<BUCKET_FROM_LOG>
```

### 3. Verify CORS Configuration
Choose **ONE** of the following methods:

**Option A: New gcloud storage command:**
```bash
gcloud storage buckets describe gs://<BUCKET_FROM_LOG> --format="default(cors)"
```

**Option B: Legacy gsutil command:**
```bash
gsutil cors get gs://<BUCKET_FROM_LOG>
```

### 4. Test CORS Configuration

**For Unix/Mac/Linux:**
```bash
./scripts/test-cors.sh <BUCKET_FROM_LOG> "listings/<uid>/test.jpg"
```

**For Windows (PowerShell):**
```powershell
.\scripts\test-cors.ps1 -Bucket <BUCKET_FROM_LOG> -Path "listings/<uid>/test.jpg"
```

Expected result: `204 No Content` with proper `Access-Control-Allow-*` headers.

### 5. Test the Fix
1. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache** if needed
3. Try uploading images from `http://localhost:3000`
4. Check DevTools Network tab - no CORS/preflight failures should appear
5. Check console for: `[BR][Storage] Using bucket: <bucket-name>`

## Common Pitfalls Checklist

### Firebase Auth Configuration
Ensure **Authorized domains** in Firebase Console → Authentication → Settings → Authorized domains include:
- `localhost`
- `127.0.0.1`
- `*.vercel.app`
- `beautyreviewty.app`

### Environment Variables
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` must **EXACTLY** match the bucket name shown in console log
- Usually format: `<project-id>.appspot.com`

### Network Issues
- **Disable adblockers** and **VPNs** during testing
- Some corporate networks block Firebase Storage endpoints

### Browser Cache
- CORS changes may be cached by browsers
- Use **incognito/private mode** for testing
- Clear browser cache completely

## Troubleshooting

### Still Getting CORS Errors?
1. **Check bucket name**: Must match exactly in console log and `.env.local`
2. **Verify project ID**: `gcloud config get-value project`
3. **Check CORS applied**: Run verification command above
4. **Test in incognito mode**: Eliminates cache issues
5. **Check Firebase Console**: Storage → Rules should allow uploads

### Error: "Bucket not found"
- Verify the bucket exists in Firebase Console → Storage
- Check project ID is correct
- Ensure you have Storage Admin permissions

### Error: "Permission denied"
- Run `gcloud auth login` again
- Verify you have Storage Admin role in the Firebase project
- Check IAM permissions in Google Cloud Console

## Production Deployment

After applying CORS configuration:
1. **Deploy to Vercel**: `vercel --prod`
2. **Test production uploads**: Verify uploads work on your live domain
3. **Monitor Firebase Console**: Check Storage → Files for successful uploads

## Example Commands (Replace with your values)

**Unix/Mac/Linux:**
```bash
# Replace YOUR_PROJECT_ID and YOUR_BUCKET_NAME
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=scripts/storage-cors.json
gcloud storage buckets describe gs://YOUR_BUCKET_NAME --format="default(cors)"
./scripts/test-cors.sh YOUR_BUCKET_NAME "listings/test-uid/test.jpg"
```

**Windows (PowerShell):**
```powershell
# Replace YOUR_PROJECT_ID and YOUR_BUCKET_NAME
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=scripts/storage-cors.json
gcloud storage buckets describe gs://YOUR_BUCKET_NAME --format="default(cors)"
.\scripts\test-cors.ps1 -Bucket YOUR_BUCKET_NAME -Path "listings/test-uid/test.jpg"
```

## Success Indicators

✅ **Console shows**: `[BR][Storage] Using bucket: <bucket-name>`  
✅ **CORS test returns**: `204 No Content` with proper headers  
✅ **No CORS errors** in browser DevTools Network tab  
✅ **Upload progress** shows in your app  
✅ **Files appear** in Firebase Console → Storage → Files  
✅ **getDownloadURL** returns valid URLs  
✅ **Firestore saves** photo URLs successfully