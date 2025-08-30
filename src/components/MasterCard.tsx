'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { MasterWithExtras } from '@/types';

export default function MasterCard({ master }: { master: MasterWithExtras }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [imageError, setImageError] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Compute current photo from master.photos array
  const currentPhoto = master.photos?.[currentIndex] ?? null;
  
  // Determine image source - fallback to placeholder if error or no photo
  const imageSrc = imageError || !currentPhoto ? "/placeholder.jpg" : currentPhoto;

  // Reset image error when currentIndex or master.id changes
  useEffect(() => {
    setImageError(false);
  }, [currentIndex, master.id]);

  // Get all photos for carousel functionality
  const allPhotos = [
    ...(Array.isArray(master.photos) ? master.photos : []),
    ...(Array.isArray(master.photoUrls) ? master.photoUrls : []),
    ...(master.photo ? [master.photo] : []),
  ].filter(Boolean);

  // Fallback to placeholder if no photos
  const photos = allPhotos.length > 0 ? allPhotos : ["/placeholder.jpg"];
  const hasMultiplePhotos = photos.length > 1;

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = dragStartX - currentX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50; // minimum distance for swipe
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        goToNext(); // swipe left -> next
      } else {
        goToPrevious(); // swipe right -> previous
      }
    }
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

// Город
const city = master.city || '';

// Услуга: mainServices[0] или services[0]
const service =
(master.mainServices && master.mainServices[0]) ||
(Array.isArray(master.services) && master.services[0]) ||
'';

// Рейтинг + кол-во отзывов
const rating =
typeof master.rating === 'number'
? master.rating
: typeof master.ratingAvg === 'number'
? master.ratingAvg
: undefined;
const reviews = typeof master.reviewsCount === 'number' ? master.reviewsCount : undefined;

// Правильный id профиля
const pid = master.id || master.profileId || master.uid;

return (
<div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      {/* Photo Gallery */}
      <div className="mb-3 overflow-hidden rounded-lg border bg-gray-100 relative group">
        <div
          ref={carouselRef}
          className="relative aspect-square w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          role="region"
          aria-label="Photo gallery"
        >
<Image
            src={imageSrc}
            alt={`${master.displayName || master.name || 'Master'} - Photo ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300"
            style={{
              transform: isDragging ? `translateX(${-dragOffset}px)` : 'translateX(0)',
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentIndex === 0}
            onError={() => setImageError(true)}
          />

          {/* Navigation Arrows */}
          {hasMultiplePhotos && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
                aria-label="Previous photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
                aria-label="Next photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Photo Indicators */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPhoto(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Photo Counter */}
          {hasMultiplePhotos && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>
</div>

{/* Имя + город */}
<div className="flex items-start justify-between gap-2">
<div>
<div className="text-lg font-semibold">
{master.displayName || master.name || 'Master'}
</div>
{city && <div className="text-sm text-gray-500">{city}</div>}
{service && <div className="mt-1 text-sm text-gray-700">{service}</div>}
</div>

{/* Звезды */}
{typeof rating === 'number' && (
<div className="text-right">
<div className="leading-none">
<span className="text-amber-500">{'★'.repeat(Math.round(rating))}</span>
<span className="text-gray-300">{'★'.repeat(5 - Math.round(rating))}</span>
</div>
<div className="text-xs text-gray-500 mt-0.5">
{rating.toFixed(1)}{typeof reviews === 'number' ? ` · ${reviews}` : '' }
</div>
</div>
)}
</div>

{/* Кнопка */}
<div className="mt-4">
{pid ? (
<Link
href={`/masters/${pid}`}
className="inline-flex items-center justify-center rounded-md bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700"
>
View profile
</Link>
) : (
<button
disabled
className="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-500"
title="Profile id is missing"
>
View profile
</button>
)}
</div>
</div>
);
}
