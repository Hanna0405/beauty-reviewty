import { getAuth } from 'firebase/auth';

export const UPLOAD_SIGN_IN_MESSAGE =
  'Please sign in again before uploading a photo.';

/** User-facing message for avatar/API upload failures. */
export function mapUploadApiError(err: unknown, httpStatus?: number): string {
  if (httpStatus === 401) return UPLOAD_SIGN_IN_MESSAGE;
  if (err instanceof Error) {
    if (err.message === UPLOAD_SIGN_IN_MESSAGE) return err.message;
    const lower = err.message.toLowerCase();
    if (
      lower.includes('unauthorized') ||
      lower.includes('id token') ||
      lower.includes('not signed in')
    ) {
      return UPLOAD_SIGN_IN_MESSAGE;
    }
    return err.message;
  }
  return 'Upload failed. Please try again.';
}

async function requireCurrentUserForUpload() {
  const auth = getAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error(UPLOAD_SIGN_IN_MESSAGE);
  }
  return user;
}

export async function uploadViaApi(params: {
  file: File;
  scope: 'profile' | 'listing';
  id: string; // uid or listingId
  dir?: string; // optional subdir for listing
}) {
  const user = await requireCurrentUserForUpload();
  const token = await user.getIdToken();

  const form = new FormData();
  form.set('file', params.file);
  form.set('scope', params.scope);
  form.set('id', params.id);
  if (params.dir) form.set('dir', params.dir);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    message?: string;
    url?: string;
    path?: string;
  };

  if (!res.ok || !data.ok) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[uploadViaApi] failed', res.status, data);
    }
    if (res.status === 401) {
      throw new Error(UPLOAD_SIGN_IN_MESSAGE);
    }
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : 'Upload failed'
    );
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