'use client';

const LANGS = [
'English', 'Ukrainian', 'Russian', 'Polish', 'French',
'Spanish', 'Portuguese', 'Arabic', 'Mandarin', 'Hindi',
];

type Props = {
value: string[];
onChange: (val: string[]) => void;
label?: string;
className?: string;
};

export default function LanguagesField({ value, onChange, label, className = '' }: Props) {
const toggle = (lang: string) =>
onChange(value.includes(lang) ? value.filter(l => l !== lang) : [...value, lang]);

return (
<div className={className}>
{label && <div className="text-sm font-medium mb-1">{label}</div>}

<div className="flex flex-wrap gap-2">
{LANGS.map(l => {
const checked = value.includes(l);
return (
<label
key={l}
className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer transition
${checked ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-white hover:bg-gray-50'}`}
>
<input
type="checkbox"
className="accent-pink-600"
checked={checked}
onChange={() => toggle(l)}
/>
{l}
</label>
);
})}
</div>
</div>
);
}