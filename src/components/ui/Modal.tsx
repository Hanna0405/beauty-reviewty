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
 <div className="mt-10 w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
 {title && <h3 className="mb-3 text-lg font-semibold">{title}</h3>}
 {children}
 </div>
 </div>
 </div>
 );
}
