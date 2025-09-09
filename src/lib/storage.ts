import { storage } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export async function uploadSelectedFiles(
 listingId: string,
 files: File[],
 onProgress?: (pct: number) => void,
 signal?: AbortSignal,
 timeoutMs: number = 60_000
): Promise<string[]> {
 if (!files?.length) return [];
 const urls: string[] = [];
 for (const file of files) {
 const path = `listings/${listingId}/${Date.now()}_${file.name}`;
 const fileRef = ref(storage, path);
 const task = uploadBytesResumable(fileRef, file);
 const done = new Promise<string>((resolve, reject) => {
 const to = setTimeout(() => reject(new Error("upload-timeout")), timeoutMs);
 task.on(
 "state_changed",
 (snap) => {
 if (onProgress) {
 const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
 onProgress(pct);
 }
 },
 (err) => { clearTimeout(to); reject(err); },
 async () => {
 clearTimeout(to);
 const url = await getDownloadURL(task.snapshot.ref);
 resolve(url);
 }
 );
 signal?.addEventListener("abort", () => {
 task.cancel();
 reject(new Error("upload-aborted"));
 });
 });
 urls.push(await done);
 }
 return urls;
}
