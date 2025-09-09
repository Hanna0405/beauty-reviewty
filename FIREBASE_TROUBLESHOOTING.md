# Firebase Troubleshooting Guide

## Common Issues and Solutions

### 1. CORS/403 Errors when uploading to Firebase Storage

**Symptoms:**
- Console shows CORS errors
- 403 Forbidden errors
- Uploads fail with permission denied

**Solutions:**

#### A. Check Environment Variables
Ensure these are set in your `.env.local` file:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### B. Verify Firebase Console Settings
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Ensure `localhost` and `localhost:3000` are listed
5. Add your production domain if needed

#### C. Check Storage Rules
Ensure your `storage.rules` allow uploads:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

#### D. Deploy Updated Rules
```bash
firebase deploy --only storage
```

### 2. Firestore 400 Listen Errors

**Symptoms:**
- Console shows "400 Bad Request" for Firestore operations
- Listen operations fail
- Document reads/writes return errors

**Solutions:**

#### A. Check Firestore Rules
Ensure your `firestore.rules` are correct:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{uid} {
      allow read: if true;
      allow create, update: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

#### B. Deploy Updated Rules
```bash
firebase deploy --only firestore
```

#### C. Check App Check (if enabled)
If you have App Check enabled:
1. Go to **Firebase Console** → **App Check**
2. Temporarily disable enforcement for Firestore and Storage
3. Or integrate App Check properly in your app

### 3. Authentication Issues

**Symptoms:**
- Users can't sign in
- Auth state not persisting
- Permission denied errors

**Solutions:**

#### A. Check Authentication Providers
1. Go to **Firebase Console** → **Authentication** → **Sign-in method**
2. Ensure your providers (Google, Email/Password) are enabled
3. Check provider configuration

#### B. Verify Auth Domain
Ensure your auth domain matches your environment variable:
```bash
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
```

### 4. Storage Bucket Issues

**Symptoms:**
- Storage operations fail
- Wrong bucket being used
- Configuration errors

**Solutions:**

#### A. Check Storage Bucket
1. Go to **Firebase Console** → **Storage**
2. Note your bucket name (e.g., `your_project.appspot.com`)
3. Ensure it matches your environment variable:
```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

#### B. Remove Hardcoded Bucket
Don't hardcode the bucket in your code:
```javascript
// ❌ Wrong - hardcoded bucket
export const storage = getStorage(app, 'gs://beauty-reviewty.firebasestorage.app');

// ✅ Correct - use environment variable
export const storage = getStorage(app);
```

### 5. Development vs Production

**Local Development:**
- Use `localhost:3000` in authorized domains
- Ensure environment variables are loaded
- Check browser console for detailed errors

**Production:**
- Add your production domain to authorized domains
- Verify environment variables in your hosting platform
- Check production logs for errors

### 6. Testing Your Configuration

#### A. Test Storage Upload
```javascript
import { uploadFileToStorage } from '@/lib/upload';

// Test upload
const testUpload = async () => {
  try {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const url = await uploadFileToStorage(file, 'test/test.txt');
    console.log('Upload successful:', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### B. Test Firestore Write
```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Test write
const testWrite = async () => {
  try {
    await setDoc(doc(db, 'test', 'test-doc'), { test: true });
    console.log('Write successful');
  } catch (error) {
    console.error('Write failed:', error);
  }
};
```

### 7. Common Environment Variable Issues

#### A. Missing .env.local file
Create `.env.local` in your project root:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

#### B. Wrong variable names
Ensure variable names match exactly:
```bash
# ❌ Wrong
NEXT_PUBLIC_FIREBASE_API_KEY=your_key

# ✅ Correct
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
```

#### C. Restart Development Server
After changing environment variables:
```bash
npm run dev
# or
yarn dev
```

### 8. Debug Mode

Enable debug logging in your Firebase config:
```javascript
// Add this to see detailed Firebase logs
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', firebaseConfig);
}
```

### 9. Network Tab Debugging

1. Open browser DevTools → Network tab
2. Try to save profile
3. Look for failed requests
4. Check request headers and response
5. Verify authentication headers are present

### 10. Firebase CLI Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy rules
firebase deploy --only firestore
firebase deploy --only storage

# View project info
firebase projects:list
firebase use your_project_id
```

## Still Having Issues?

1. Check Firebase Console for error logs
2. Verify your Firebase project is on the correct plan
3. Ensure billing is enabled (required for Storage)
4. Check if you've hit any quotas or limits
5. Try creating a new Firebase project for testing
