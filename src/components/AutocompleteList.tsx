'use client';
import { useEffect, useMemo, useState } from 'react';

export type Option = { id: string; title: string; city?: string; services?: string[]; photoUrl?: string };
export default function AutocompleteList({
 value,
 onSelect,
 options,
 placeholder = 'Начните вводить имя/город/услугу…',
 maxVisible = 8,
}: {
 value: string;
 onSelect: (opt: Option) => void;
 options: Option[];
 placeholder?: string;
 maxVisible?: number;
}) {
 const [q, setQ] = useState(value);
 useEffect(() => setQ(value), [value]);

 const filtered = useMemo(() => {
 const s = q.trim().toLowerCase();
 if (!s) return options.slice(0, maxVisible);
 return options
 .filter(o =>
 (o.title || '').toLowerCase().includes(s) ||
 (o.city || '').toLowerCase().includes(s) ||
 (o.services || []).some(sv => sv.toLowerCase().includes(s))
 )
 .slice(0, maxVisible);
 }, [q, options, maxVisible]);

 return (
 <div className="space-y-2">
 <input
 value={q}
 onChange={(e) => setQ(e.target.value)}
 placeholder={placeholder}
 className="w-full rounded border p-2"
 />
 <div className="rounded border divide-y max-h-72 overflow-auto bg-white">
 {filtered.length ? filtered.map(o => (
 <button
 key={o.id}
 type="button"
 onClick={() => onSelect(o)}
 className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
 >
 {o.photoUrl ? <img src={o.photoUrl} alt="" className="h-10 w-14 object-cover rounded" /> : <div className="h-10 w-14 bg-gray-100 rounded" />}
 <div className="min-w-0">
 <div className="font-medium truncate">{o.title}</div>
 <div className="text-xs text-gray-500 truncate">{o.city || '—'} • {(o.services || []).slice(0,3).join(', ')}</div>
 </div>
 </button>
 )) : (
 <div className="px-3 py-2 text-gray-500 text-sm">Ничего не найдено</div>
 )}
 </div>
 </div>
 );
}
