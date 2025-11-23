'use client';
import React from 'react';
export default function Modal({
 open, onClose, children, title,
}: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string; }) {
 if (!open) return null;
 return (
 <div className="fixed inset-0 z-50">
 <div className="absolute inset-0 bg-black/40" onClick={onClose} />
 <div className="absolute inset-0 flex items-start justify-center overflow-auto p-4">
 <div className="relative mt-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
 {title && <h3 className="mb-3 text-lg font-semibold pr-8">{title}</h3>}
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onClose();
 }}
 className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
 aria-label="Close"
 >
 ×
 </button>
 {children}
 </div>
 </div>
 </div>
 );
}
