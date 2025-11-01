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
 const ql = (q || "").trim().toLowerCase();
 if (!ql) return options.slice(0, maxVisible);

 // helper to normalize service item to string
 const toStr = (sv: any) => {
 if (!sv) return '';
 if (typeof sv === 'string') return sv;
 if (typeof sv === 'object') {
 return (
 sv.name ||
 sv.title ||
 sv.label ||
 sv.key ||
 ''
 );
 }
 return String(sv);
 };

 return options
 .filter((o) => {
 const title = (o.title || o.name || "").toLowerCase();
 const city =
 (o.city?.formatted ||
 o.city?.name ||
 o.city ||
 "").toLowerCase();
 const servicesArr = Array.isArray(o.services) ? o.services : [];
 const serviceHit = servicesArr.some((sv: any) => {
 if (typeof sv === "string") return sv.toLowerCase().includes(ql);
 if (typeof sv === "object")
 return (
 (sv.name && sv.name.toLowerCase().includes(ql)) ||
 (sv.title && sv.title.toLowerCase().includes(ql)) ||
 (sv.key && sv.key.toLowerCase().includes(ql))
 );
 return false;
 });

 return (
 !ql ||
 title.includes(ql) ||
 city.includes(ql) ||
 serviceHit
 );
 })
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
