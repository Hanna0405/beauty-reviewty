# Unified CityAutocomplete Component

A unified Google Places-based city autocomplete component for Next.js + Firebase applications.

## Features

- **Cities Only**: Shows only cities (`types: ['(cities)']`)
- **English Results**: Forces English suggestions/results (`language: 'en'`)
- **No Free Text**: Prevents free-form text from being saved (must be a selected prediction with a `place_id`)
- **Normalized Output**: Returns a consistent `NormalizedCity` object
- **Consistent UX**: Same component across Profile Edit, Listing New/Edit, and Masters filters
- **Lightweight**: No external UI libraries, uses Tailwind CSS
- **Photo Upload Safe**: Does not break existing photo upload logic

## Usage

### Basic Usage

```tsx
import CityAutocomplete from '@/components/CityAutocomplete';
import { NormalizedCity } from '@/lib/cityNormalize';

function MyForm() {
  const [city, setCity] = useState<NormalizedCity | null>(null);

  return (
    <CityAutocomplete
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
      label="City"
      value={city}
      onChange={setCity}
      required
      region="CA"
    />
  );
}
```

### With Validation

```tsx
import { ensureSelectedCity } from '@/lib/ensureCity';

const handleSubmit = async () => {
  try {
    // This will throw an error if no city is selected
    const selectedCity = ensureSelectedCity(city);
    
    // Save to Firestore
    await updateDoc(doc(db, 'profiles', user.uid), {
      city: selectedCity,
      cityKey: selectedCity.slug,
      cityName: selectedCity.formatted,
    });
  } catch (err) {
    setError('Please select a city from the list');
  }
};
```

### For Masters Filters

```tsx
<CityAutocomplete
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
  label="City"
  value={city}
  onChange={(c) => {
    setCity(c);
    if (c?.slug) {
      router.push(`/masters?city=${encodeURIComponent(c.slug)}`);
    }
  }}
  region="CA"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | ✅ | - | Google Maps API key |
| `value` | `NormalizedCity \| null` | ✅ | - | Current selected city |
| `onChange` | `(city: NormalizedCity \| null) => void` | ✅ | - | Callback when city changes |
| `label` | `string` | ❌ | `'City'` | Label for the input |
| `placeholder` | `string` | ❌ | `'Start typing your city…'` | Placeholder text |
| `disabled` | `boolean` | ❌ | `false` | Disable the input |
| `required` | `boolean` | ❌ | `false` | Mark as required field |
| `className` | `string` | ❌ | `''` | Additional CSS classes |
| `region` | `string` | ❌ | `'CA'` | Country code for region bias |

## NormalizedCity Type

```tsx
type NormalizedCity = {
  city: string;           // "Toronto"
  state?: string;            // "Ontario"
  stateCode?: string;       // "ON"
  country: string;          // "Canada"
  countryCode: string;      // "CA"
  formatted: string;        // "Toronto, ON, Canada"
  lat: number;              // 43.6532
  lng: number;              // -79.3832
  placeId: string;          // "ChIJ...abc123"
  slug: string;             // "toronto-on-canada"
};
```

## Environment Variables

Make sure to set your Google Maps API key:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_api_key_here
```

## Migration from Old Components

### Before (Old CityAutocomplete)
```tsx
<CityAutocomplete 
  value={city} 
  onChange={(label, meta) => { 
    setCity(label); 
    setCityPlaceId(meta?.placeId); 
  }} 
/>
```

### After (New CityAutocomplete)
```tsx
<CityAutocomplete
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
  label="City"
  value={city}
  onChange={setCity}
  region="CA"
/>
```

## Error Handling

The component includes built-in error handling:

- Shows error message if required field is empty
- Prevents free-form text input
- Displays helpful hints to users
- Validates selection before form submission

## Integration Examples

### Profile Edit Form
```tsx
const [city, setCity] = useState<NormalizedCity | null>(null);

<CityAutocomplete
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
  label="City"
  value={city}
  onChange={setCity}
  required
  region="CA"
/>

// On save:
const selected = ensureSelectedCity(city);
await updateDoc(doc(db, 'profiles', user.uid), {
  city: selected,
  cityKey: selected.slug,
  cityName: selected.formatted,
});
```

### Listing Form
```tsx
// Same pattern as profile form
const [city, setCity] = useState<NormalizedCity | null>(null);

// Save to listing document
await updateDoc(doc(db, 'listings', listingId), {
  city: selected,
  cityKey: selected.slug,
  cityName: selected.formatted,
});
```

### Masters Filter
```tsx
<CityAutocomplete
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
  label="City"
  value={city}
  onChange={(c) => {
    setCity(c);
    if (c?.slug) {
      router.push(`/masters?city=${encodeURIComponent(c.slug)}`);
    }
  }}
  region="CA"
/>

// Query with:
where('cityKey', '==', slug)
```

## Notes

- **ENV**: `NEXT_PUBLIC_GOOGLE_MAPS_KEY` must be set in `.env.local` + Vercel
- **Language**: Autocomplete always returns English results
- **Validation**: Manual text is rejected on save
- **Migration**: Old city inputs must be replaced with new component
- **Performance**: Component loads Google Maps API only when needed
- **Accessibility**: Includes proper ARIA labels and keyboard navigation
