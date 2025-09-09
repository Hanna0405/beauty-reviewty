import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export async function uploadWithFallback(
  file: File, 
  path: string, 
  opts?: { 
    forceFallback?: boolean; 
    onProgress?: (p: number) => void 
  }
): Promise<{ url: string; path: string }> {
  const useSDK = !opts?.forceFallback;

  if (useSDK) {
    try {
      const task = uploadBytesResumable(sRef(getStorage(), path), file, { 
        contentType: file.type 
      });

      await new Promise<void>((resolve, reject) => {
        task.on("state_changed", 
          s => { 
            if (opts?.onProgress && s?.bytesTransferred && s?.totalBytes) {
              opts.onProgress(Math.round(100 * s.bytesTransferred / s.totalBytes));
            }
          }, 
          reject, 
          () => resolve()
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);
      console.info("[BR][Upload] Client SDK OK:", path);
      return { url, path };
    } catch (err: any) {
      const msg = (err?.message || "").toLowerCase();
      const isCors = msg.includes("cors") || msg.includes("preflight") || 
                    msg.includes("network") || msg.includes("failed");
      
      if (!isCors) { 
        console.warn("[BR][Upload] SDK error (not CORS):", err); 
        throw err; 
      }
      console.warn("[BR][Upload] SDK CORS blocked, falling back:", err);
    }
  }

  // Fallback to server-side API
  const fd = new FormData(); 
  fd.append("file", file); 
  fd.append("path", path);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`API upload failed: ${res.status}`);

  const data = await res.json(); 
  console.info("[BR][Upload] Fallback OK:", path);
  return data as { url: string; path: string };
}