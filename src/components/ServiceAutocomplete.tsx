import React, { useState, useRef, useEffect } from "react";

type Props = {
 value: string[];
 onChange: (next: string[]) => void;
 options: string[]; // your service list
 placeholder?: string;
 required?: boolean;
 error?: string;
};

export default function ServiceAutocomplete({ value, onChange, options, placeholder, required, error }: Props) {
 const [input, setInput] = useState("");
 const [open, setOpen] = useState(false);
 const boxRef = useRef<HTMLDivElement>(null);

  const filtered = input.trim().length >= 2 
    ? options.filter(o => o.toLowerCase().includes(input.toLowerCase()) && !value.includes(o))
    : [];

 // Close dropdown when clicking outside
 useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
   if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
    setOpen(false);
   }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const add = (s: string) => {
  onChange([...value, s]);
  setInput("");
  setOpen(false); // CLOSE after selection
 };

 const remove = (s: string) => onChange(value.filter(v => v !== s));

 return (
 <div className="relative" ref={boxRef}>
  <div className="flex flex-wrap gap-2 mb-2">
   {value.map(tag => (
    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
     {tag}
     <button type="button" className="text-pink-600 hover:text-pink-800 font-bold" onClick={() => remove(tag)}>×</button>
    </span>
   ))}
  </div>
  <input
   value={input}
   onChange={(e) => { setInput(e.target.value); setOpen(true); }}
   onFocus={() => setOpen(true)}
   onKeyDown={(e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' && filtered.length > 0) {
     e.preventDefault();
     add(filtered[0]);
    }
   }}
   placeholder={placeholder || "Type to search services..."}
   className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
    error ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-white hover:border-pink-300'
   }`}
   required={required}
  />
  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  {open && filtered.length > 0 && (
   <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-pink-200 bg-white shadow-lg">
    {filtered.map(s => (
     <button 
      type="button" 
      key={s} 
      className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-pink-100 last:border-b-0"
      onClick={() => add(s)}
     >
      {s}
     </button>
    ))}
   </div>
  )}
 </div>
 );
}