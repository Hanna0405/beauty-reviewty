'use client';

import usePlacesAutocomplete from 'use-places-autocomplete';

type Props = {
value: string;
onChange: (val: string) => void;
};

export default function CityAutocomplete({ value, onChange }: Props) {
const {
ready,
suggestions: { status, data },
setValue,
clearSuggestions,
} = usePlacesAutocomplete();

return (
<div className="relative">
<input
type="text"
value={value}
onChange={(e) => setValue(e.target.value)}
placeholder="Start typing a city..."
className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition"
disabled={!ready}
/>
{status === 'OK' && (
<ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow">
{data.map(({ place_id, description }) => (
<li
key={place_id}
onClick={() => {
onChange(description);
setValue(description, false);
clearSuggestions();
}}
className="px-3 py-2 cursor-pointer hover:bg-gray-50"
>
{description}
</li>
))}
</ul>
)}
</div>
);
}