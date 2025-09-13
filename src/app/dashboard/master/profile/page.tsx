'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { requireDb, requireStorage } from '@/lib/firebase';
import { useCurrentUserOrRedirect } from '@/hooks/useCurrentUserOrRedirect';
import ProfileCard from '@/components/ProfileCard';
import type { MasterProfile } from '@/types/profile';

export default function MasterProfilePage() {
  const { user, loading: authLoading } = useCurrentUserOrRedirect();
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  // Listen to profile changes
  useEffect(() => {
    if (!user?.uid) return;

    try {
      requireDb();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Firestore is not initialized. Profile will not load.");
      }
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(requireDb(), 'profiles', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as MasterProfile;
          setProfile({ ...data, uid: docSnapshot.id });
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to profile:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleEdit = () => {
    router.push('/dashboard/master/profile/edit');
  };

  const handleDelete = async () => {
    if (!user?.uid || !profile) return;

    try {
      requireDb();
    } catch (error) {
      alert('Database is not available. Please check your configuration.');
      return;
    }

    setDeleting(true);
    try {
      // Delete profile document
      const db = requireDb();
      await deleteDoc(doc(db, 'profiles', user.uid));
      console.log('Profile deleted successfully');

      // Optionally clean up storage files
      try {
        const storage = requireStorage();
        const storageRef = ref(storage, `profiles/${user.uid}`);
        const result = await listAll(storageRef);
        
        // Delete all files in the profile folder
        const deletePromises = result.items.map(itemRef => deleteObject(itemRef));
        await Promise.all(deletePromises);
        
        console.log('Storage files cleaned up successfully');
      } catch (storageError) {
        console.warn('Failed to clean up storage files:', storageError);
        // Continue even if storage cleanup fails
      }

      // Redirect to dashboard
      router.push('/dashboard/master');
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateProfile = () => {
    router.push('/dashboard/master/profile/edit');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching profile
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your profile information and social links</p>
            </div>
            <Link
              href="/dashboard/master"
              className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        {profile ? (
          <ProfileCard
            profile={profile}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          /* No Profile State */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Your Profile</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Set up your master profile to showcase your services, add photos, and connect with potential clients.
            </p>
            <button
              onClick={handleCreateProfile}
              className="inline-flex items-center bg-pink-600 text-white px-6 py-3 rounded-md font-medium hover:bg-pink-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Profile
            </button>
          </div>
        )}

        {/* Delete Loading Overlay */}
        {deleting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-800">Deleting profile...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
