'use client';
import { useMemo, useState, useCallback, useEffect } from 'react';

export function ThreadGallery({ photos }: { photos: string[] }) {
  const images = useMemo(() => (Array.isArray(photos) ? photos.filter(Boolean) : []), [photos]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = useCallback((i: number) => {
    setIdx(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, prev, next]);

  if (!images.length) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, 9).map((src, i) => (
          <button key={i} onClick={() => openAt(i)} className="aspect-square overflow-hidden rounded border">
            {/* do not alter image host logic; let next/image or img as you already use */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      {images.length > 9 && (
        <button onClick={() => openAt(9)} className="text-sm underline">View all {images.length} photos</button>
      )}

      {/* modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <button aria-label="Close" onClick={close} className="absolute top-4 right-4 text-white text-xl">✕</button>
          <button onClick={prev} className="absolute left-4 text-white text-2xl">‹</button>
          <div className="max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[idx]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
          </div>
          <button onClick={next} className="absolute right-4 text-white text-2xl">›</button>
        </div>
      )}
    </div>
  );
}
