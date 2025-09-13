import React, { useEffect, useRef, useState } from "react";

export default function LanguagesAutocomplete({
 onAdd,
 options,
}: {
 onAdd: (lang: string) => void;
 options: string[];
}) {
 const [value, setValue] = useState("");
 const [open, setOpen] = useState(false);
 const inputRef = useRef<HTMLInputElement | null>(null);
 const rootRef = useRef<HTMLDivElement | null>(null);

  // Filter options based on input (only after 2+ characters)
  const filtered = value.trim().length >= 2 
    ? options.filter((lang) => lang.toLowerCase().includes(value.toLowerCase()))
    : [];

 const select = (lang: string) => {
 onAdd?.(lang);
 setValue("");
 setOpen(false);
 inputRef.current?.blur();
 };

 const onBlur = () => setTimeout(() => setOpen(false), 120);
 const onFocus = () => setOpen((options?.length ?? 0) > 0);

 useEffect(() => {
 const onDocClick = (e: MouseEvent) => {
 if (!rootRef.current) return;
 if (!rootRef.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", onDocClick);
 return () => document.removeEventListener("mousedown", onDocClick);
 }, []);

 return (
 <div ref={rootRef} className="relative">
 <input
 type="text"
 ref={inputRef}
 value={value}
 placeholder="Type to add a language..."
 onChange={(e) => { const v = e.target.value; setValue(v); setOpen(Boolean(v.trim()) || (options?.length ?? 0) > 0); }}
 onBlur={onBlur}
 onFocus={onFocus}
 className="w-full"
 />
 {open && filtered.length > 0 && (
 <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow">
 {filtered.map((lang) => (
 <li
 key={lang}
 className="cursor-pointer px-3 py-2"
 onMouseDown={(e) => { e.preventDefault(); select(lang); }}
 >
 {lang}
 </li>
 ))}
 </ul>
 )}
 </div>
 );
}
