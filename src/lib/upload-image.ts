export async function uploadViaApi(params: {
  file: File;
  scope: 'profile' | 'listing';
  id: string; // uid or listingId
  dir?: string; // optional subdir for listing
}) {
  const form = new FormData();
  form.set('file', params.file);
  form.set('scope', params.scope);
  form.set('id', params.id);
  if (params.dir) form.set('dir', params.dir);

  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) {
    let msg = 'API upload failed';
    try { const j = await res.json(); msg += `: ${j.error ?? res.statusText}`; } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as { ok: true; path: string; url: string };
}

/**
 * Legacy uploadImage function for backward compatibility
 * Converts path-based uploads to scope-based uploads
 */
export async function uploadImage(file: File, path: string): Promise<{ url: string; path: string }> {
  // Parse the path to determine scope and id
  const pathParts = path.split('/');
  
  if (pathParts[0] === 'profiles') {
    // profiles/{uid}/...
    const id = pathParts[1];
    const result = await uploadViaApi({ file, scope: 'profile', id });
    return { url: result.url, path: result.path };
  } else if (pathParts[0] === 'listings') {
    // listings/{listingId}/...
    const id = pathParts[1];
    const dir = pathParts.slice(2).join('/'); // remaining path as subdirectory
    const result = await uploadViaApi({ file, scope: 'listing', id, dir });
    return { url: result.url, path: result.path };
  } else if (pathParts[0] === 'reviews') {
    // reviews/{reviewId}/...
    const id = pathParts[1];
    const result = await uploadViaApi({ file, scope: 'listing', id, dir: 'reviews' });
    return { url: result.url, path: result.path };
  } else if (pathParts[0] === 'users') {
    // users/{uid}/photos/... - treat as profile photos
    const id = pathParts[1];
    const result = await uploadViaApi({ file, scope: 'profile', id });
    return { url: result.url, path: result.path };
  } else {
    // Fallback: treat as listing upload with temp id
    const result = await uploadViaApi({ file, scope: 'listing', id: 'temp', dir: pathParts.join('/') });
    return { url: result.url, path: result.path };
  }
}