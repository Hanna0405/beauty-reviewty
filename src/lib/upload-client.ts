import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { requireStorage } from '@/lib/firebase/client';

/**
 * Safeguard: Check if URL contains signed URL parameters (should not be persisted)
 */
function isSignedUrl(url: string): boolean {
  return url.includes('GoogleAccessId=') || url.includes('X-Goog-');
}

/**
 * Upload image using Firebase CLIENT SDK only.
 * Returns public download URL (firebasestorage.googleapis.com/v0/b/...)
 * NOT signed URLs.
 */
export async function uploadImageViaApi(file: File, folder: string): Promise<string> {
  try {
    const storage = requireStorage();
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    // Sanitize filename
    const cleanName = (file.name || `file-${Date.now()}`).replace(/[^\w.\-]+/g, '_');
    
    // Build storage path
    const timestamp = Date.now();
    const ext = cleanName.split('.').pop() || 'jpg';
    const storagePath = `${folder}/${timestamp}_${cleanName}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file using CLIENT SDK
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    
    // Get public download URL (NOT signed URL)
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Safeguard: Reject signed URLs
    if (isSignedUrl(downloadURL)) {
      console.error('[upload] ERROR: Received signed URL instead of public URL:', downloadURL);
      throw new Error('Invalid URL format: signed URLs are not allowed');
    }
    
    // Verify it's a public Firebase Storage URL
    if (!downloadURL.includes('firebasestorage.googleapis.com/v0/b/')) {
      console.warn('[upload] WARNING: URL does not match expected Firebase Storage format:', downloadURL);
    }
    
    console.log('[upload success]', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('[upload failed]', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
}

export async function deleteFromStorage(path: string): Promise<void> {
 const res = await fetch('/api/storage/delete', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ path }) 
 });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || 'Delete failed');
}
