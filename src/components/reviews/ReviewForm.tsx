'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadReviewPhotos } from '@/lib/reviews/uploadReviewPhotos';
import { probeStorageRules } from '@/lib/reviews/probeStorageRules';
import { createReviewViaApi } from '@/lib/reviews/createClient';

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
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Probe storage rules in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      probeStorageRules();
    }
  }, [user]);

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
    if (!user) { setErrorMsg("Please sign in to leave a review."); return; }
    if (!subjectId || typeof subjectId !== 'string') { setErrorMsg("Invalid subject id"); return; }
    if (!rating || rating < 1 || rating > 5) { setErrorMsg("Please select a rating (1–5)."); return; }

    console.log("submit review", { subjectType, subjectId, hasUser: !!user });
    console.log("[review][create] payload", { subjectId, rating, text, photos: files.length });

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // 1) Upload photos using stable uploader
      const photoUrls = await uploadReviewPhotos(files, { masterId: subjectId });

      // 2) Submit review via secure API route
      await createReviewViaApi({
        subject: { type: subjectType, id: subjectId },
        rating: Number(rating),
        text: (text || '').trim(),
        photos: photoUrls.map(url => ({ url, path: url })), // Convert to expected format
      });

      console.log("[review][ok] Review submitted successfully");

      // 3) Reset UI
      setText('');
      setFiles([]);
      setPreviews([]);
      setRating(5);
      setSuccessMsg('Your review was added successfully.');
      onSubmitted?.();
    } catch (err: any) {
      console.error("Review submit failed:", err);
      
      // Better error messages based on error type
      let msg = "Failed to submit review.";
      if (err?.message) {
        if (err.message.includes('401') || err.message.includes('Not signed in') || err.message.includes('sign in')) {
          msg = "Please sign in to leave a review.";
        } else if (err.message.includes('Invalid subject') || err.message.includes('Text too long')) {
          msg = err.message; // Show specific validation error
        } else if (err.message.includes('500')) {
          msg = "Something went wrong. Please try again.";
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
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

      {successMsg && <p className="text-green-600 text-sm mt-2">{successMsg}</p>}
      {errorMsg && <p className="text-red-600 text-sm mt-2">{errorMsg}</p>}
    </form>
  );
}
