import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { uploadFileToStorage } from '@/lib/upload';
import { sanitizeProfileData, type SanitizedProfileData } from '@/lib/utils/sanitizeProfileData';

export interface ProfileData extends SanitizedProfileData {
  updatedAt: any;
}

export function useSaveProfile() {
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async (formValues: any, avatarFile?: File): Promise<ProfileData> => {
    // Check authentication
    const currentUser = auth?.currentUser;
    if (!currentUser?.uid) {
      throw new Error('User not authenticated. Please sign in again.');
    }

    // Check Firestore initialization
    if (!db) {
      throw new Error('Database is not initialized. Check Firebase configuration.');
    }

    setIsSaving(true);
    
    try {
      console.log('[saveProfile] Starting profile save for user:', currentUser.uid);
      
      let finalAvatarUrl: string | null = null;
      
      // Upload avatar file if provided
      if (avatarFile) {
        console.log('[saveProfile] Uploading avatar file:', avatarFile.name);
        const timestamp = Date.now();
        const filename = `${timestamp}-${avatarFile.name}`;
        const path = `profiles/${currentUser.uid}/${filename}`;
        
        try {
          const uploadedUrl = await uploadFileToStorage(avatarFile, path);
          finalAvatarUrl = uploadedUrl;
          console.log('[saveProfile] Avatar uploaded successfully:', finalAvatarUrl);
        } catch (uploadError) {
          console.error('[saveProfile] Avatar upload failed:', uploadError);
          throw new Error(`Failed to upload avatar: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Sanitize profile data using utility function
      const sanitizedData = sanitizeProfileData(formValues, currentUser.uid, finalAvatarUrl);
      
      // Add timestamp
      const profileData: ProfileData = {
        ...sanitizedData,
        updatedAt: serverTimestamp(),
      };

      console.log('[saveProfile] Profile data prepared (sanitized):', profileData);

      // Save to Firestore with merge: true
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await setDoc(profileRef, profileData, { merge: true });
      
      console.log('[saveProfile] Profile saved to Firestore successfully');

      return profileData;
    } catch (error) {
      console.error('[saveProfile] Error saving profile:', error);
      
      // Re-throw the error for the form to handle
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to save profile: Unknown error occurred');
      }
    } finally {
      // Always reset isSaving to prevent button from freezing
      setIsSaving(false);
      console.log('[saveProfile] Save operation completed, isSaving reset to false');
    }
  };

  return {
    saveProfile,
    isSaving,
  };
}
