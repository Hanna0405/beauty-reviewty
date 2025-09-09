export async function uploadImage(file: File, path: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("path", path);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) { 
    let r = `${res.status}`; 
    try {
      const j = await res.json(); 
      if (j?.error) r += ` ${j.error}`;
    } catch {}
    throw new Error(`API upload failed: ${r}`); 
  }
  return await res.json() as { url: string; path: string };
}
