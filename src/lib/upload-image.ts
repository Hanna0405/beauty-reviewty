import { getAuth } from 'firebase/auth';

export async function uploadViaApi(params: {
  file: File;
  scope: 'profile' | 'listing';
  id: string; // uid or listingId
  dir?: string; // optional subdir for listing
}) {
  const auth = getAuth();
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const form = new FormData();
  form.set('file', params.file);
  form.set('scope', params.scope);
  form.set('id', params.id);
  if (params.dir) form.set('dir', params.dir);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('[upload failed]', data);
    throw new Error(data.message || 'Upload failed');
  }
  console.log('[upload success]', data.url);
  return data as { ok: true; path: string; url: string };
}

/**
 * Upload multiple images via API and return array of results
 * @param files - Array of files to upload
 * @returns Promise<Array<{url: string, path: string, w?: number, h?: number}>>
 */
export async function uploadImagesViaApi(files: File[]): Promise<Array<{url: string, path: string, w?: number, h?: number}>> {
  const uploadPromises = files.map(async (file) => {
    // Use a temporary scope for review photos
    const result = await uploadViaApi({ 
      file, 
      scope: 'listing', 
      id: 'temp', 
      dir: 'reviews' 
    });
    return {
      url: result.url,
      path: result.path,
      // Note: w/h would need to be added by the API if needed
    };
  });
  
  return Promise.all(uploadPromises);
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