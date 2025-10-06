'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { requireDb } from '@/lib/firebase/client'; // этот у вас есть и работает в клиенте

export default function DeleteButton({ id, after }: { id: string; after?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (pending || !id) return;

    // 1) проверим, что пользователь залогинен (через client Firebase)
    const auth = getAuth();
    if (!auth.currentUser) {
      alert('Please sign in to delete listings.');
      return;
    }

    if (!confirm('Delete this listing? This cannot be undone.')) return;

    setPending(true);
    try {
      // 2) прямое удаление из Firestore
      const db = requireDb();
      await deleteDoc(doc(db, 'listings', id));

      after?.();
      router.refresh(); // обновим страницу/список
    } catch (e: any) {
      // Если rules запрещают — будет FirebaseError: permission-denied
      alert(e?.message || 'Delete failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="rounded-md bg-red-500 px-3 py-2 text-white text-sm hover:bg-red-600 disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
