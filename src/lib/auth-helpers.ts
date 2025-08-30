import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';

// Server-side function to get current user
export async function getCurrentUser(): Promise<{ user: any; profile: UserProfile | null } | null> {
  try {
    // Note: This is a simplified version. In a real app, you'd need to handle Firebase Auth tokens
    // and verify them server-side. This is just a placeholder for the structure.
    
    // For now, we'll return null as server-side Firebase Auth requires additional setup
    // In a production app, you'd typically:
    // 1. Get the Firebase ID token from cookies/headers
    // 2. Verify the token with Firebase Admin SDK
    // 3. Get the user UID from the verified token
    // 4. Fetch the user profile from Firestore
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Server action to require authentication
export async function requireAuth(): Promise<UserProfile> {
  const userData = await getCurrentUser();
  
  if (!userData?.user) {
    redirect('/login');
  }
  
  if (!userData.profile) {
    // User exists but no profile - redirect to complete profile
    redirect('/complete-profile');
  }
  
  return userData.profile;
}

// Server action to require specific role
export async function requireRole(role: "master" | "client"): Promise<UserProfile> {
  const profile = await requireAuth();
  
  if (profile.role !== role) {
    // User doesn't have the required role
    if (profile.role === 'master') {
      redirect('/dashboard/master');
    } else {
      redirect('/masters');
    }
  }
  
  return profile;
}

// Client-side helper to get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Helper to check if user has required role
export function hasRole(profile: UserProfile | null, requiredRole: "master" | "client"): boolean {
  return profile?.role === requiredRole;
}

// Helper to get redirect URL based on user role
export function getRedirectUrl(profile: UserProfile | null, fallback: string = '/masters'): string {
  if (!profile) return fallback;
  
  switch (profile.role) {
    case 'master':
      return '/dashboard/master';
    case 'client':
      return '/masters';
    default:
      return fallback;
  }
}