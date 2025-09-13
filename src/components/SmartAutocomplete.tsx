"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string; leftIcon?: React.ReactNode; meta?: any };

type Props = {
  placeholder?: string;
  options: Option[];
  value: Option[] | Option | null;
  onChange: (v: Option[] | Option | null) => void;
  multi?: boolean;
  minChars?: number;
};

export default function SmartAutocomplete({
  placeholder,
  options,
  value,
  onChange,
  multi = false,
  minChars = 1,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minChars) return options.slice(0, 20);
    return options.filter(o => o.label.toLowerCase().includes(q)).slice(0, 30);
  }, [query, options, minChars]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function commitSelect(opt: Option) {
    if (multi) {
      const arr = Array.isArray(value) ? [...value] as Option[] : [];
      if (!arr.find(v => v.value === opt.value)) arr.push(opt);
      onChange(arr);
    } else {
      onChange(opt);
    }
    setQuery("");
    setOpen(false); // IMPORTANT: close after select
  }

  function removeAt(i: number) {
    if (!multi) return;
    const arr = Array.isArray(value) ? [...value] as Option[] : [];
    arr.splice(i, 1);
    onChange(arr);
  }

  return (
    <div ref={boxRef} className="relative">
      {/* Selected chips (for multi) */}
      {multi && Array.isArray(value) && value.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={v.value} className="inline-flex items-center gap-1 border rounded px-2 py-0.5 text-sm">
              {v.leftIcon}{v.label}
              <button type="button" onClick={() => removeAt(i)} aria-label="Remove">×</button>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => { /* handled by document click; keep input value */ }}
        onKeyDown={(e) => {
          if (!open && (e.key.length === 1 || e.key === "Backspace")) setOpen(true);
          if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h+1, filtered.length-1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h-1, 0)); }
          if (e.key === "Enter" && filtered[highlight]) { e.preventDefault(); commitSelect(filtered[highlight]); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="w-full rounded border px-3 py-2"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow">
          {filtered.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left ${i===highlight?"bg-gray-100":""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => commitSelect(opt)}
            >
              {opt.leftIcon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
