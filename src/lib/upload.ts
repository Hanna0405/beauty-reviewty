import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  StorageReference 
} from 'firebase/storage';
import { requireStorage } from '@/lib/firebase';

/**
 * Upload a file to Firebase Storage and return the download URL
 * Uses Firebase SDK properly to avoid CORS/403 errors
 * 
 * @param file - File to upload
 * @param path - Storage path (e.g., 'profiles/uid/avatar.jpg')
 * @returns Promise<string> - Download URL
 */
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  try {
    console.log('[upload] Starting upload to path:', path);
    
    const storage = requireStorage();
    
    // Create storage reference
    const storageRef: StorageReference = ref(storage, path);
    
    // Upload file using uploadBytesResumable for better control
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Wait for upload to complete
    const snapshot = await uploadTask;
    console.log('[upload] Upload completed, getting download URL...');
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[upload] Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[upload] Error uploading file:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('Upload unauthorized. Please check your authentication.');
      } else if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('Storage quota exceeded. Please try again later.');
      } else if (error.message.includes('storage/retry-limit-exceeded')) {
        throw new Error('Upload failed after multiple retries. Please check your connection.');
      }
    }
    
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple files and return their download URLs
 * @param files - Array of files to upload
 * @param pathPrefix - Base path for all files
 * @returns Promise<string[]> - Array of download URLs
 */
export async function uploadMultipleFiles(files: File[], pathPrefix: string): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${index}-${file.name}`;
    const path = `${pathPrefix}/${filename}`;
    return uploadFileToStorage(file, path);
  });
  
  return Promise.all(uploadPromises);
}
