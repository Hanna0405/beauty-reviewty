'use client';
import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { useAuthUser } from '@/lib/useAuthUser';
import { db } from '@/lib/firebase';
import { uploadImagesViaApi } from '@/lib/upload-image';
import { createPublicReview } from '@/lib/createPublicReview';

function Stars({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={i <= value ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface ReviewFormProps {
  subjectType: 'master' | 'listing';
  subjectId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ subjectType, subjectId, onSubmitted }: ReviewFormProps) {
  const { user } = useAuthUser();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (!subjectId || typeof subjectId !== 'string') {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!user) {
    return <p className="text-sm text-gray-500">Please sign in to leave a review.</p>;
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const arr = Array.from(e.target.files ?? []).slice(0, 3);
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { alert("Please sign in to leave a review."); return; }
    if (!subjectId || typeof subjectId !== 'string') { alert("Invalid master id"); return; }
    if (!rating || rating < 1 || rating > 5) { alert("Please select a rating (1–5)."); return; }

    console.log("submit review", { subjectType, subjectId, hasUser: !!user });
    console.log("[review][create] payload", { subjectId, rating, text, photos: files.length });

    setSaving(true);
    try {
      // 1) Upload photos via our existing API (returns [{url, path, w?, h?}])
      const uploaded = files.length ? await uploadImagesViaApi(files.slice(0,3)) : [];

      // 2) Build collection ref safely (document -> subcollection)
      const colRef = subjectType === 'master'
        ? collection(doc(db, 'masters', subjectId), 'reviews')
        : collection(db, 'listings', subjectId, 'reviews'); // unchanged for listings

      // 3) Write review
      const reviewRef = await addDoc(colRef, {
        rating,
        text: (text || '').trim(),
        photos: uploaded,
        authorUid: user.uid,
        authorName: user.displayName ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4) If this is a master review, also create public review doc
      if (subjectType === 'master') {
        try {
          // IMPORTANT: create/merge public feed card using the same reviewId
          await createPublicReview({
            publicId: reviewRef.id,
            masterId: subjectId, // for master subjectType
            rating,
            text: (text || '').trim(),
            photos: uploaded,
            authorUid: user.uid,
            authorName: user.displayName ?? null,
          });

          console.log("[public][ok]", reviewRef.id);
        } catch (err) {
          console.error('Failed to create public review doc:', err);
          // Don't fail the whole operation if public doc creation fails
        }
      }

      // 5) Reset UI
      setText('');
      setFiles([]);
      setPreviews([]);
      setRating(5);
      onSubmitted?.();
    } catch (err: any) {
      console.error("Review submit failed:", err);
      const msg = err?.message || "Failed to submit review.";
      alert(msg); // show real reason (e.g., Missing or insufficient permissions)
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-semibold">Reviews</h3>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Your rating:</span>
        <Stars value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm mb-1">Describe your experience…</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Describe your experience..."
          className="w-full rounded-lg border-gray-300 focus:border-pink-500 focus:ring-pink-500 p-2.5"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Photos (up to 3)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="mt-1 block w-full text-sm"
        />
        {!!previews.length && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`preview ${i+1}`}
                className="h-20 w-20 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!rating || rating < 1 || rating > 5 || saving}
        className="rounded-lg bg-pink-600 text-white px-4 py-2 hover:bg-pink-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Add review'}
      </button>
    </form>
  );
}
