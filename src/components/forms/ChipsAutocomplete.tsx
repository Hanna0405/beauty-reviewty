"use client";
import React, { useMemo, useState } from "react";

type Props = {
placeholder: string;
value: string[];
onChange: (list: string[]) => void;
suggestions: string[];
id?: string;
};

export default function ChipsAutocomplete({ placeholder, value, onChange, suggestions, id }: Props) {
const [input, setInput] = useState("");

const filtered = useMemo(() => {
const q = input.trim().toLowerCase();
if (!q) return suggestions.slice(0, 8);
return suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
}, [input, suggestions]);

function addChip(s: string) {
if (!s) return;
if (!value.includes(s)) onChange([...value, s]);
setInput("");
}
function removeChip(s: string) {
onChange(value.filter(v => v !== s));
}

return (
<div className="mb-4">
<div className="flex flex-wrap gap-2 mb-2">
{value.map(v => (
<span key={v} className="px-2 py-1 rounded-md bg-pink-50 text-pink-700 border border-pink-200 text-sm inline-flex items-center gap-2">
{v}
<button type="button" onClick={() => removeChip(v)} aria-label={`remove ${v}`} className="text-pink-500 hover:text-pink-700">×</button>
</span>
))}
</div>
<input
id={id}
value={input}
onChange={e => setInput(e.target.value)}
onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (filtered[0]) addChip(filtered[0]); } }}
placeholder={placeholder}
className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
/>
{filtered.length > 0 && (
<div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
{filtered.map(s => (
<button
type="button"
key={s}
onClick={() => addChip(s)}
className="block w-full text-left px-3 py-2 hover:bg-pink-50 text-sm"
>{s}</button>
))}
</div>
)}
</div>
);
}
