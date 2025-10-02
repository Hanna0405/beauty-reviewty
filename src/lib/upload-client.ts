export async function uploadImageViaApi(file: File, folder: string): Promise<string> {
 const fd = new FormData();
 fd.append('files', file); // use plural
 fd.append('listingId', folder);
 const res = await fetch('/api/upload', { method: 'POST', body: fd });
 const body = await res.json().catch(() => ({}));
 
 if (!res.ok || !body.files) {
   console.error('[upload] failed:', body);
   throw new Error(body?.error || 'Upload failed');
 }
 return body.files[0]?.url || '';
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
