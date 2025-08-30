import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function upload(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function removeByUrl(url: string): Promise<void> {
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
    if (!pathMatch) {
      throw new Error('Invalid storage URL');
    }
    
    const path = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error removing file:', error);
    throw new Error('Failed to remove file');
  }
}

/**
 * Upload multiple files and return their download URLs
 * @param files - Array of files to upload
 * @param pathPrefix - The base path for all files
 * @returns Promise<string[]> - Array of download URLs
 */
export async function uploadMultiple(files: File[], pathPrefix: string): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${index}-${file.name}`;
    const path = `${pathPrefix}/${filename}`;
    return upload(file, path);
  });
  
  return Promise.all(uploadPromises);
}
