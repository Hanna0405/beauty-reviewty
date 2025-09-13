export async function uploadImageViaApi(file: File, folder: string): Promise<string> {
 const fd = new FormData();
 fd.set('file', file);
 fd.set('folder', folder);
 const res = await fetch('/api/upload', { method: 'POST', body: fd });
 const data = await res.json();
 if (!res.ok || !data?.ok || !data?.url) throw new Error(data?.error || 'Upload failed');
 return data.url as string;
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
