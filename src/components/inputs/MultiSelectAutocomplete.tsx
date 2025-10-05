'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Option = { value: string; label: string; emoji?: string };
type Props = {
  label: string;
  placeholder?: string;
  options: Option[];
  value: Option[];
  onChange: (vals: Option[]) => void;
};

export default function MultiSelectAutocomplete({ label, placeholder = 'Type to search…', options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options.slice(0, 50);
    
    // Prioritize starts-with matches, then contains matches
    const startsWith = options.filter(o => 
      o.label.toLowerCase().startsWith(t) || o.value.toLowerCase().startsWith(t)
    );
    const contains = options.filter(o => 
      !startsWith.includes(o) && (o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t))
    );
    
    return [...startsWith, ...contains].slice(0, 50);
  }, [q, options]);

  const toggle = (option: Option) => {
    const isSelected = value.some(v => v.value === option.value);
    if (isSelected) {
      onChange(value.filter(x => x.value !== option.value));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="w-full" ref={ref}>
      <label className="mb-1 block text-sm">{label}</label>
      <div className="rounded-md border">
        <div className="flex flex-wrap gap-2 p-2">
          {value.length === 0 && <span className="text-sm text-gray-400">No selection</span>}
          {value.map(v => (
            <button key={v.value} type="button" onClick={() => toggle(v)} className="rounded-full border px-2 py-1 text-xs">
              {v.emoji ? `${v.emoji} ` : ''}{v.label} ✕
            </button>
          ))}
        </div>
        <input
          className="w-full border-t px-3 py-2 outline-none"
          placeholder={placeholder}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {open && (
        <ul className="z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No results</li>
          ) : filtered.map(o => (
            <li key={o.value}
              onClick={() => { toggle(o); setOpen(false); setQ(''); }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100">
              {o.emoji ? `${o.emoji} ` : ''}{o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
