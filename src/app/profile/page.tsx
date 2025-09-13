'use client';

import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
const { user, profile, loading } = useAuth();

if (loading) return <div className="p-6">Loading…</div>;
if (!user) return <div className="p-6">Please log in to view your profile.</div>;

return (
<div className="p-6 max-w-3xl mx-auto">
<h1 className="mb-4 text-2xl font-bold">Profile</h1>
<div className="rounded border p-4">
<div className="mb-2 font-medium">Name: {profile?.displayName ?? '—'}</div>
<div className="mb-2 text-gray-600">Email: {user.email}</div>
<div className="text-gray-600">UID: {user.uid}</div>
<div className="text-gray-600">Role: {profile?.role ?? 'client'}</div>
</div>
</div>
);
}
