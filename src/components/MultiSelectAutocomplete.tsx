'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '@/catalog/services';

type Props = {
  label: string;
  items: CatalogItem[];
  value: CatalogItem[];
  onChange: (val: CatalogItem[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export default function MultiSelectAutocomplete({
  label, items, value, onChange,
  placeholder = 'Start typing…',
  max = 10, disabled, required, className,
}: Props) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    const exclude = new Set(value.map(v => v.key));
    const pool = items.filter(i => !exclude.has(i.key));
    if (!q) return pool;
    return pool.filter(i => {
      const hay = (i.name + ' ' + (i.aliases?.join(' ') ?? '')).toLowerCase();
      return hay.includes(q);
    });
  }, [input, items, value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function addItem(it: CatalogItem) {
    if (value.find(v => v.key === it.key)) return;
    if (value.length >= max) return;
    onChange([...value, { key: it.key, name: it.name, emoji: it.emoji }]);
    setInput(''); setOpen(false);
  }
  function removeItem(key: string) {
    onChange(value.filter(v => v.key !== key));
  }
  const showError = touched && required && value.length === 0;

  return (
    <div ref={ref} className={`w-full ${className ?? ''}`}>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(v => (
          <span key={v.key} className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-2 py-1 text-xs">
            <span>{v.emoji ?? '•'}</span><span>{v.name}</span>
            <button type="button" className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => removeItem(v.key)} aria-label={`Remove ${v.name}`}>×</button>
          </span>
        ))}
      </div>
      <input
        type="text" inputMode="search" autoComplete="off" spellCheck={false}
        value={input}
        onChange={(e) => { setTouched(true); setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && filtered[0]) { e.preventDefault(); addItem(filtered[0]); }}}
        placeholder={placeholder}
        disabled={!!disabled || value.length >= max}
        className={`w-full rounded-md border ${showError ? 'border-red-400' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300`}
      />
      {open && filtered.length > 0 && (
        <ul className="mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map(it => (
            <li key={it.key} className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
            onMouseDown={(e) => e.preventDefault()} onClick={() => addItem(it)}>
              <span className="mr-2">{it.emoji ?? '•'}</span>{it.name}
            </li>
          ))}
        </ul>
      )}
      {showError && <p className="mt-1 text-xs text-red-500">Please select at least one item.</p>}
      {value.length >= max && <p className="mt-1 text-xs text-gray-500">Maximum {max} selected.</p>}
    </div>
  );
}