'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MasterProfileForm from '@/components/MasterProfileForm';
import { auth } from '@/lib/firebase';

export default function EditProfilePage() {
 const { id } = useParams<{ id: string }>();
 const [ready, setReady] = useState(false);

 // ждём инициализации auth (если нужно ограничение по входу)
 useEffect(() => {
 if (!auth) {
   setReady(true);
   return;
 }
 const unsub = auth.onAuthStateChanged(() => setReady(true));
 return () => unsub();
 }, []);

 if (!ready) return <main className="container-page py-6">Loading…</main>;

 return (
 <main className="container-page py-6">
 <h1 className="mb-4 text-2xl font-semibold">Master Profile</h1>
 {/* форма сама грузит/сохраняет данные и фото для профиля с id */}
 <MasterProfileForm />
 </main>
 );
}