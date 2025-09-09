# Firebase Admin SDK Setup for Server-Side Upload Fallback

This guide helps you set up the Firebase Admin SDK to enable server-side upload fallback when CORS blocks client-side uploads.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Firebase Client SDK (existing - keep these)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (NEW - for server-side upload fallback)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## How to Get Firebase Admin Credentials

### Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click on **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### Step 2: Extract Values from JSON

From the downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",           // → FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",  // → FIREBASE_CLIENT_EMAIL
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Step 3: Set Environment Variables

1. Copy the values to your `.env.local` file
2. **Important**: Keep the `\n` characters in the private key - they're needed for proper formatting
3. **Never commit** the `.env.local` file to version control

## How the Fallback Works

### Primary Path: Client-Side Firebase SDK
- Fast, direct upload to Firebase Storage
- Works when CORS is properly configured
- Shows upload progress in real-time

### Fallback Path: Server-Side API Route
- Automatically triggered when CORS blocks client-side uploads
- Uses Firebase Admin SDK to upload from server
- Bypasses browser CORS restrictions entirely
- Returns the same download URL format

### Automatic Detection
The system automatically detects CORS errors and switches to the fallback:
- CORS errors: `cors`, `preflight`, `network` in error message
- Other errors: Still thrown to surface real issues

## Testing the Setup

1. **Start your development server**: `npm run dev`
2. **Open browser console** and look for: `[BR][Storage] Using bucket: <bucket-name>`
3. **Try uploading** a photo or avatar
4. **Check console** for any CORS errors
5. **Verify upload** appears in Firebase Console → Storage

## Troubleshooting

### Error: "Firebase Admin SDK not initialized"
- Check that all environment variables are set correctly
- Verify the private key format (must include `\n` characters)
- Ensure the service account has Storage Admin permissions

### Error: "API upload failed"
- Check server logs for detailed error messages
- Verify the service account has proper permissions
- Ensure the storage bucket name matches your project

### Still getting CORS errors
- The fallback should automatically handle CORS issues
- Check that the `/api/upload` route is accessible
- Verify the upload components are using `uploadWithFallback`

## Security Notes

- **Never commit** service account keys to version control
- Use environment variables for all sensitive data
- The Admin SDK runs only on the server side
- Client-side code still uses the regular Firebase SDK

## Production Deployment

When deploying to production (Vercel, etc.):

1. **Set environment variables** in your deployment platform
2. **Use the same service account** or create a new one for production
3. **Test uploads** on the production domain
4. **Monitor logs** for any upload failures

The fallback system ensures uploads work regardless of CORS configuration!
