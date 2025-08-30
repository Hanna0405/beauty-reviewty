'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { RequireRole } from '@/components/auth/guards';
import MasterListingForm from '@/components/masters/MasterListingForm';

export default function NewListingPage() {
  return (
    <RequireRole role="master">
      <Content />
    </RequireRole>
  );
}

function Content() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Listing</h1>
        <p className="text-gray-600">
          Create a new service listing to attract clients and grow your business.
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <MasterListingForm 
            mode="create"
            uid={user.uid}
          />
        </div>
      </div>
    </div>
  );
}
