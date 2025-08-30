'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: "master" | "client" | null;
  loading: boolean;
  signup: (email: string, password: string, name: string, role: "master" | "client") => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
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
  };

  // Create user profile in Firestore
  const createUserProfile = async (uid: string, name: string, role: "master" | "client"): Promise<void> => {
    try {
      const userProfile: Omit<UserProfile, 'createdAt'> = {
        uid,
        role,
        name,
        avatar: user?.photoURL || undefined,
      };

      await setDoc(doc(db, 'users', uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Refresh profile data
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const userProfile = await fetchUserProfile(user.uid);
      setProfile(userProfile);
    }
  };

  // Signup with email and password
  const signup = async (email: string, password: string, name: string, role: "master" | "client"): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: newUser } = userCredential;
      
      await createUserProfile(newUser.uid, name, role);
      
      // Profile will be fetched by the auth state listener
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Profile will be fetched by the auth state listener
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user: googleUser } = result;
      
      // Check if user profile exists
      const existingProfile = await fetchUserProfile(googleUser.uid);
      
      if (!existingProfile) {
        // If no profile exists, we'll need to create one
        // For now, we'll create a default client profile
        // In a real app, you might want to show a role selection modal
        await createUserProfile(googleUser.uid, googleUser.displayName || 'User', 'client');
      }
      
      // Profile will be fetched by the auth state listener
    } catch (error) {
      console.error('Error during Google login:', error);
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    role: profile?.role || null,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
