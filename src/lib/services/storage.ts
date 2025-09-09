import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  urls: string[];
  errors: Array<{ fileName: string; error: string }>;
}

/** Upload a single File/Blob to Firebase Storage under given path and return its download URL. */
export async function uploadFileToStorage(path: string, file: File | Blob): Promise<string> {
 const r = ref(storage, path);
 const snap = await uploadBytes(r, file);
 return await getDownloadURL(snap.ref);
}

/** Upload a single file with progress tracking */
export async function uploadFileWithProgress(
  path: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  const storage = getStorageSafe();
  if (!storage) throw new Error("Firebase Storage is not initialized. Check Firebase settings.");
  
  const r = ref(storage, path);
  const uploadTask = uploadBytesResumable(r, file);
  
  return new Promise((resolve, reject) => {
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
          reject(error);
        }
      }
    );
  });
}

/** Upload multiple files with progress tracking and return array of URLs. */
export async function uploadMultiple(
  prefix: string, 
  files: File[],
  onProgress?: (progress: UploadProgress[]) => void
): Promise<UploadResult> {
  const results: string[] = [];
  const errors: Array<{ fileName: string; error: string }> = [];
  const progressArray: UploadProgress[] = files.map((file, index) => ({
    fileIndex: index,
    fileName: file.name,
    progress: 0,
    status: 'uploading'
  }));

  // Update initial progress
  onProgress?.(progressArray);

  // Upload files in parallel for better performance
  const uploadPromises = files.map(async (file, index) => {
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${prefix}/${Date.now()}_${index}.${ext}`;
      
      const url = await uploadFileWithProgress(path, file, (progress) => {
        progressArray[index].progress = progress;
        onProgress?.([...progressArray]);
      });
      
      progressArray[index].status = 'completed';
      progressArray[index].progress = 100;
      onProgress?.([...progressArray]);
      
      return { index, url, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      progressArray[index].status = 'error';
      progressArray[index].error = errorMessage;
      onProgress?.([...progressArray]);
      
      errors.push({ fileName: file.name, error: errorMessage });
      return { index, url: null, success: false };
    }
  });

  const uploadResults = await Promise.all(uploadPromises);
  
  // Sort results by index to maintain order
  uploadResults
    .filter(result => result.success)
    .sort((a, b) => a.index - b.index)
    .forEach(result => {
      if (result.url) results.push(result.url);
    });

  return { urls: results, errors };
}