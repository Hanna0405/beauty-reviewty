import { useState } from 'react';
import { uploadImageViaApi } from '@/lib/upload-client';
import { downscaleToWebp } from '@/lib/image/resize';

async function apiDelete(path: string) {
 const res = await fetch('/api/storage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || 'delete failed');
}

export function useAvatarUpload() {
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState<string | null>(null);

 async function upload(file: File, uid: string): Promise<string> {
 setLoading(true); setErr(null);
 try {
 const resized = await downscaleToWebp(file, 1600, 0.85);
 const url = await uploadImageViaApi(resized, `profiles/${uid}`);
 return url;
 } catch (e:any) {
 setErr(e?.message || 'Upload failed');
 throw e;
 } finally {
 setLoading(false);
 }
 }

 async function remove(existingPath?: string) {
 setLoading(true); setErr(null);
 try {
 if (existingPath) await apiDelete(existingPath);
 } catch (e:any) {
 setErr(e?.message || 'Delete failed'); throw e;
 } finally {
 setLoading(false);
 }
 }
 return { upload, remove, loading, err };
}
