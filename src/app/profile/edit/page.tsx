'use client';

import Script from 'next/script';
import RequireAuth from '@/components/RequireAuth';
import ProfileEditClient from './ProfileEditClient'; // keep your existing form

export default function ProfileEditPage() {
 return (
 <>
   <Script
     src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
     strategy="afterInteractive"
   />
   <RequireAuth>
     <ProfileEditClient />
   </RequireAuth>
 </>
 );
}