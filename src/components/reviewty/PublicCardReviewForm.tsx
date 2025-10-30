"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client"; // IMPORTANT: use the same client-side Firestore you already use in other client components. If your project calls it something else (like `firebaseClient`), update this import.
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// If you already have a photo uploader component/hook used in "Add review", import and reuse it instead of the simple placeholder below.

type Props = {
  publicCardSlug: string; // e.g. "pc_vancouver-bc-ca_dasha"
};

export default function PublicCardReviewForm({ publicCardSlug }: Props) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const storage = getStorage();
      const user = getAuth().currentUser;
      if (!user) {
        alert("Please sign in to upload photos");
        setSubmitting(false);
        return;
      }
      const uid = user.uid;
      const photoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `publicReviews/${uid}/${Date.now()}_${i}_${f.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, f);
        const url = await getDownloadURL(fileRef);
        photoUrls.push(url);
      }

      const auth = getAuth();
      await addDoc(collection(db, "publicReviews"), {
        publicCardSlug, // link to this master card
        rating: Number(rating),
        text,
        photos: photoUrls,
        authorUid: auth.currentUser?.uid || null,
        authorName: auth.currentUser?.displayName || "Verified client",
        createdAt: serverTimestamp(),
      });

      // simple reset UI
      setRating(5);
      setText("");
      setFiles([]);
      setDone(true);
    } catch (err) {
      console.error("failed to submit review", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {done && (
        <div className="text-green-600 text-sm font-medium">
          Thank you! Your review was submitted ✔
        </div>
      )}

      {/* Rating row like on screenshot */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {/* Star rating control — keep your existing StarRating if you have it */}
          {/* If you have no StarRating component, we emulate with 5 buttons */}
          <div className="flex">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`Rate ${v}`}
                onClick={() => setRating(v)}
                className="text-2xl leading-none"
              >
                {v <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>
        <span className="text-lg font-medium">
          {rating?.toFixed ? rating.toFixed(1) : Number(rating || 0).toFixed(1)}
        </span>
      </div>

      {/* Your experience */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Your experience
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was the service?"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
      </div>

      {/* Photos (optional) — native file chooser like on screenshot */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Photos (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            setFiles(list); // keep your state setter; if you used another name, map accordingly
          }}
          className="block w-full text-sm"
        />
        {/* Thumbs preview (optional, safe no-op if files empty) */}
        {files?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f: File, i: number) => (
              <div key={i} className="w-16 h-16 rounded overflow-hidden border">
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) =>
                    URL.revokeObjectURL((e.target as HTMLImageElement).src)
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-md px-4 py-2 font-semibold bg-rose-500 text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
      >
        {submitting ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
