import { FirestoreError } from 'firebase/firestore';

// Global toast function - will be set by the app
let showToast: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

// Set the toast function from the app
export function setToastFunction(toastFn: (message: string, type: 'success' | 'error' | 'info') => void) {
  showToast = toastFn;
}

// Show non-blocking notice using the app's toast system
function showNonBlockingNotice(message: string, type: 'error' | 'info' = 'error') {
  if (showToast) {
    showToast(message, type);
  } else {
    // Fallback to console if toast is not available
    console.warn('Firestore Error:', message);
  }
}

export function handleFirestoreError(err: unknown) {
  const code = (err as any)?.code;
  
  if (code === 'failed-precondition') {
    // composite indexes are building
    showNonBlockingNotice('Firestore is building composite indexes. Please refresh in a few minutes.', 'info');
    return;
  }
  
  if (code === 'permission-denied') {
    showNonBlockingNotice('Permission denied. Please review your Firestore security rules.');
    return;
  }
  
  if (code === 'unavailable') {
    showNonBlockingNotice('Firestore is temporarily unavailable. Please try again later.', 'info');
    return;
  }
  
  if (code === 'resource-exhausted') {
    showNonBlockingNotice('Query limit exceeded. Please try with fewer results.', 'info');
    return;
  }
  
  if (code === 'invalid-argument') {
    showNonBlockingNotice('Invalid query parameters. Please check your filters.');
    return;
  }
  
  showNonBlockingNotice(`Unexpected Firestore error: ${code || 'unknown'}`);
}

// Legacy function for backward compatibility
export function handleFirestoreErrorLegacy(error: unknown): string {
  if (error instanceof FirestoreError) {
    switch (error.code) {
      case 'failed-precondition':
        return 'Firestore is building indexes, please refresh the page in a few minutes.';
      case 'permission-denied':
        return 'Permission denied, please check Firestore security rules.';
      case 'unavailable':
        return 'Firestore is temporarily unavailable, please try again later.';
      case 'resource-exhausted':
        return 'Query limit exceeded, please try with fewer results.';
      case 'invalid-argument':
        return 'Invalid query parameters, please check your filters.';
      default:
        return `Firestore error: ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}

export function isFirestoreError(error: unknown): error is FirestoreError {
  return error instanceof FirestoreError;
}
