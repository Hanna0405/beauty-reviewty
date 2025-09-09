# Firebase Storage CORS Setup

## Apply CORS to Firebase Storage Bucket

To fix CORS errors with Firebase Storage, apply the CORS configuration to your bucket:

### Using gcloud CLI:
```bash
gcloud storage buckets update gs://beauty-reviewty.appspot.com --cors-file=cors.json
```

### Using gsutil:
```bash
gsutil cors set cors.json gs://beauty-reviewty.appspot.com
```

## Firebase Auth Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains, ensure these domains exist:
- `localhost`
- `localhost:3000` 
- `beautyreviewty.app`
- `www.beautyreviewty.app`

## After Setup

1. Wait a few minutes for CORS changes to propagate
2. Hard-reload the app (Ctrl+Shift+R or Cmd+Shift+R)
3. Test file uploads

## Notes

- CORS changes can take 5-10 minutes to take effect
- If using a CDN/proxy, ensure it doesn't strip CORS headers
- The CORS configuration allows all necessary methods and headers for Firebase Storage operations
