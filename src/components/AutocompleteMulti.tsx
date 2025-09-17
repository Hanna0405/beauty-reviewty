'use client';
import { useMemo, useState, useRef } from 'react';

type Option = { value: string; label: string; emoji?: string };
type Props = {
 value: string[];
 onChange: (v: string[]) => void;
 options: Option[]; // full dictionary
 placeholder?: string;
 autoOpenOnType?: boolean;
 autoCloseOnSelect?: boolean;
};

export default function AutocompleteMulti({ 
 value, 
 onChange, 
 options, 
 placeholder,
 autoOpenOnType = false,
 autoCloseOnSelect = false 
}: Props) {
 const [q, setQ] = useState('');
 const [isOpen, setIsOpen] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);
 
 const filtered = useMemo(() => {
 const s = q.trim().toLowerCase();
 if (!s) return options.slice(0, 50);
 return options.filter(o => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)).slice(0, 50);
 }, [q, options]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const newValue = e.target.value;
 setQ(newValue);
 
 if (autoOpenOnType) {
 setIsOpen(newValue.length > 0);
 }
 };

 const handleSelect = (optionValue: string) => {
 if (!value.includes(optionValue)) {
 onChange([...value, optionValue]);
 }
 
 if (autoCloseOnSelect) {
 setIsOpen(false);
 setQ('');
 inputRef.current?.blur();
 }
 };

 const shouldShowDropdown = autoOpenOnType ? isOpen && q.length > 0 : true;

 return (
 <div className="space-y-2">
 <div className="flex flex-wrap gap-2">
 {value.map(v => {
 const opt = options.find(o => o.value === v);
 return (
 <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-pink-100 text-pink-800 text-sm">
 {opt?.emoji && <span>{opt.emoji}</span>}{opt?.label ?? v}
 <button type="button" onClick={() => onChange(value.filter(x => x !== v))} className="ml-1 text-pink-700 hover:text-pink-900">×</button>
 </span>
 );
 })}
 </div>
 <input
 ref={inputRef}
 className="w-full rounded border p-2"
 placeholder={placeholder ?? 'Type to search…'}
 value={q}
 onChange={handleInputChange}
 onFocus={() => {
 if (autoOpenOnType && q.length > 0) {
 setIsOpen(true);
 }
 }}
 onBlur={() => {
 // Delay closing to allow click events to fire
 setTimeout(() => setIsOpen(false), 150);
 }}
 />
 {shouldShowDropdown && (
 <div className="max-h-56 overflow-auto border rounded">
 {filtered.map(o => (
 <button
 key={o.value}
 type="button"
 onClick={() => handleSelect(o.value)}
 className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
 >
 {o.emoji && <span>{o.emoji}</span>}
 <span>{o.label}</span>
 </button>
 ))}
 {!filtered.length && <div className="px-3 py-2 text-gray-500">No matches</div>}
 </div>
 )}
 </div>
 );
}
