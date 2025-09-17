'use client';
import { useState } from 'react';

export default function SearchBar({
  placeholder = 'Enter your city or service…',
  onSubmit,
}: { 
  placeholder?: string; 
  onSubmit?: (q: string)=>void 
}) {
  const [q, setQ] = useState('');
  
  return (
    <form
      onSubmit={(e)=>{
        e.preventDefault(); 
        onSubmit?.(q.trim());
      }}
      className="w-full max-w-3xl mx-auto flex items-center gap-2 rounded-xl border border-rose-200/70 bg-white/90 shadow-sm px-3 py-2 focus-within:ring-2 focus-within:ring-rose-300 transition"
      aria-label="Search masters"
    >
      <span className="inline-flex select-none px-2">🔍</span>
      <input
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm md:text-base placeholder:text-rose-400/70"
        aria-label="Search input"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-lg bg-rose-500 text-white text-sm md:text-base hover:bg-rose-600 active:bg-rose-700 transition"
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
