'use client';

import { useAuth } from '@/contexts/AuthContext';
import PhoneAuthBlock from '@/components/PhoneAuthBlock';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { updateProfile, sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  // Notification settings state
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyOnBooking, setNotifyOnBooking] = useState(true);
  const [role, setRole] = useState<'client' | 'master'>('client');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    // Initialize form with existing profile data
    if (profile) {
      setNotifyEmail(profile.notifyEmail || user?.email || '');
      setNotifyOnBooking(profile.notifyOnBooking ?? true);
      setRole(profile.role || 'client');
    }
  }, [profile, user?.email]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        notifyEmail,
        notifyOnBooking,
        role,
        updatedAt: serverTimestamp(),
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const handleChangeEmail = async () => {
    if (!user?.email) return;
    
    try {
      if (auth.currentUser && notifyEmail) {
        await updateEmail(auth.currentUser, String(notifyEmail));
      }
      toast.success('Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>
            
            <div className="grid gap-8">
              {/* User Info */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">Not linked</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Display Name</label>
                      <p className="mt-1 text-sm text-gray-900">{profile?.displayName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-sm text-gray-900">{profile?.role || 'client'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <p className="mt-1 text-sm text-gray-500 font-mono">{user.uid}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications & Role</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Enter email for notifications"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      This email will receive booking notifications
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifyOnBooking}
                        onChange={(e) => setNotifyOnBooking(e.target.checked)}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Email me about bookings
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="client"
                          checked={role === 'client'}
                          onChange={(e) => setRole(e.target.value as 'client' | 'master')}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Client</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="master"
                          checked={role === 'master'}
                          onChange={(e) => setRole(e.target.value as 'client' | 'master')}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Master</span>
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Changing role affects access to "My Listings"
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>


              {/* Phone Linking */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Link Phone Number</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add a phone number to your account for additional security and easier sign-in.
                  </p>
                  <PhoneAuthBlock forceMode="link" />
                </div>
              </div>

              {/* Account Actions */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2">Change Email</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Update your account email address
                    </p>
                    <button
                      onClick={handleChangeEmail}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      Change Account Email
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Send a password reset email to your current email address
                    </p>
                    <button
                      onClick={handleChangePassword}
                      className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
