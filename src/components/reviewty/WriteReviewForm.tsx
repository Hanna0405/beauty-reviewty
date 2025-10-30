"use client";

import React, { useState } from "react";
import { fireConfettiBurst } from "@/lib/ui/confetti";
import { uploadImagesAndGetUrls } from "@/lib/media/upload";
import { useAuthReady } from "@/lib/hooks/useAuthReady";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WriteReviewForm(props: {
  masterSlug: string;
  masterName: string;
  masterId?: string;
  cityName?: string;
  serviceNames?: string[];
  languageNames?: string[];
  onSubmitted?: (r: any) => void; // will be PublicReview
}) {
  const {
    masterSlug,
    masterName,
    masterId,
    cityName,
    serviceNames,
    languageNames,
    onSubmitted,
  } = props;

  const { user: currentUser } = useAuthReady();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // GATED VIEW: user not signed in
  if (!currentUser || !currentUser.uid) {
    return (
      <div className="border rounded-lg shadow-sm bg-white p-4 text-sm text-gray-700 flex flex-col gap-3">
        <div className="font-semibold text-gray-900">
          Only verified clients can leave a review
        </div>
        <div className="text-gray-600">
          Please sign in to share your experience.
        </div>
        <a
          href="/login"
          className="inline-block self-start rounded-md bg-pink-600 px-4 py-2 text-white text-sm font-medium"
        >
          Sign in to leave a review
        </a>
      </div>
    );
  }

  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 photos
    const validFiles = files.slice(0, 10);

    setUploading(true);
    try {
      // Use existing upload utility
      const urls = await uploadImagesAndGetUrls(
        validFiles,
        "reviews/publicCard/",
        10
      );
      setPhotos((prev) => [...prev, ...urls].slice(0, 10)); // Keep max 10 total
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMsg("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setErrorMsg("");

    try {
      // build the doc that matches our PublicReview shape
      const docData = {
        masterSlug,
        masterName,
        rating,
        text,
        photos: photos || [],
        cityName: cityName || null,
        serviceNames: serviceNames || [],
        languageNames: languageNames || [],
        clientName: currentUser.displayName || null,
        clientUid: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      // Save to the correct collection based on whether masterId is provided
      let docRef;
      if (masterId) {
        // Save to subcollection: publicCards/{masterId}/reviews
        const reviewsCol = collection(db, "publicCards", masterId, "reviews");
        docRef = await addDoc(reviewsCol, docData);
      } else {
        // Fallback to global reviews collection for backward compatibility
        const reviewsCol = collection(db, "reviews");
        docRef = await addDoc(reviewsCol, docData);
      }

      // Return the shape compatible with PublicReview for optimistic UI:
      const newReview = {
        id: docRef.id,
        masterSlug,
        masterName,
        rating,
        text,
        photos: photos || [],
        cityName: cityName || undefined,
        serviceNames: serviceNames || [],
        languageNames: languageNames || [],
        clientName: currentUser.displayName || undefined,
        createdAt: new Date().toISOString(), // optimistic, server will have serverTimestamp
      };

      // optimistic UI update
      if (onSubmitted) {
        onSubmitted(newReview);
      }

      // clear form
      setRating(5);
      setText("");
      setPhotos([]);

      // fire confetti using our existing confetti util
      await fireConfettiBurst();
    } catch (err: any) {
      console.error("createPublicReview failed", err);
      setErrorMsg("Failed to submit review. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg shadow-sm bg-white p-4 flex flex-col gap-4"
    >
      <div className="text-lg font-semibold text-gray-900">Leave a review</div>

      {/* Rating selector */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-700 font-medium">Rating</label>
        <div className="flex items-center gap-1 text-yellow-500 text-xl leading-none">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={star <= rating ? "text-yellow-500" : "text-gray-300"}
            >
              ★
            </button>
          ))}
          <span className="text-sm text-gray-700 ml-2">{rating}.0</span>
        </div>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-700 font-medium">
          Your experience
        </label>
        <textarea
          className="w-full rounded border border-gray-300 p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How was the service?"
          required
        />
      </div>

      {/* Photo uploader */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-700 font-medium">
          Photos (optional)
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || photos.length >= 10}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50"
        />

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {photos.map((url, i) => (
              <div
                key={i}
                className="relative w-16 h-16 rounded border overflow-hidden bg-gray-100"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="text-sm text-gray-500">Uploading photos...</div>
        )}
      </div>

      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

      <button
        type="submit"
        disabled={isSending || uploading}
        className="self-start inline-flex items-center rounded-md bg-pink-600 px-4 py-2 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending
          ? "Sending..."
          : uploading
          ? "Uploading..."
          : "Submit review"}
      </button>
    </form>
  );
}
