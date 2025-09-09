import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from "firebase/storage";
import { storage, getStorageSafe } from "./firebase";

/**
 * Upload a single file to Firebase Storage with proper metadata
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  
  // Set proper metadata
  const metadata = {
    contentType: file.type,
    cacheControl: "public,max-age=3600"
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(
  files: File[],
  basePath: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const fileName = `${file.name}-${Date.now()}-${index}`;
    const filePath = `${basePath}/${fileName}`;
    
    return uploadFile(file, filePath, (progress) => {
      onProgress?.(index, progress);
    });
  });

  return Promise.allSettled(uploadPromises).then(results => {
    const successful: string[] = [];
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        errors.push(`File ${files[index].name}: ${result.reason.message}`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Upload errors: ${errors.join(', ')}`);
    }
    
    return successful;
  });
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete file:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Get image dimensions from URL
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Delete a file from Firebase Storage by its download URL
 */
export async function deleteByUrl(url: string): Promise<void> {
  try {
    if (!url) return;
    const u = new URL(url);
    const encoded = u.pathname.split("/o/")[1] || "";
    const path = decodeURIComponent(encoded);
    const storage = getStorageSafe();
    const objRef = ref(storage, path);
    await deleteObject(objRef);
  } catch (e) {
    console.error("deleteByUrl failed:", e);
  }
}

// Export compatibility function
export const uploadFilesAndGetURLs = uploadFiles;