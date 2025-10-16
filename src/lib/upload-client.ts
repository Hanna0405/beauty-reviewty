import { getAuth } from 'firebase/auth';

export async function uploadImageViaApi(file: File, folder: string): Promise<string> {
 const auth = getAuth();
 const user = auth.currentUser;
 const token = user ? await user.getIdToken() : null;

 const fd = new FormData();
 fd.append('file', file);
 fd.append('scope', 'listing');
 fd.append('listingId', folder);
 const res = await fetch('/api/upload', {
   method: 'POST',
   headers: {
     ...(token ? { Authorization: `Bearer ${token}` } : {}),
   },
   body: fd,
 });
 const data = await res.json().catch(() => ({}));
 
 if (!data.ok) {
   console.error('[upload failed]', data);
   throw new Error(data.message || 'Upload failed');
 }
 
 console.log('[upload success]', data.url);
 return data.url;
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
