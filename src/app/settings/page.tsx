'use client';

import { useAuth } from '@/contexts/AuthContext';
import PhoneAuthBlock from '@/components/PhoneAuthBlock';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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
                      <p className="mt-1 text-sm text-gray-900">{profile?.phone || 'Not linked'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Display Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user.displayName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="mt-1 text-sm text-gray-900">{user.role || 'client'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <p className="mt-1 text-sm text-gray-500 font-mono">{user.uid}</p>
                    </div>
                  </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
