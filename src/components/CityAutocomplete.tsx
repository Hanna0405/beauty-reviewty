'use client';
import { useEffect, useRef, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/mapsLoader';

type Props = {
  value?: string; // display (localized ok)
  onChange: (city: string | undefined, meta?: { placeId?: string; key?: string; countryCode?: string; adminCode?: string }) => void;
  label?: string;
  placeholder?: string;
  country?: string | undefined; // optional ISO-2 restriction (CA/US/…)
};

function buildCityFromComponents(components: google.maps.GeocoderAddressComponent[] | undefined, placeId?: string) {
  if (!components) return undefined;

  const get = (type: string) => components.find(c => c.types.includes(type));
  // City can be 'locality' or sometimes 'postal_town' or 'sublocality_level_1'
  const locality = get('locality') || get('postal_town') || get('sublocality') || get('sublocality_level_1');
  const admin1 = get('administrative_area_level_1'); // province/state
  const country = get('country');

  const city = locality?.long_name || '';
  const st = admin1?.short_name || '';
  const cc = country?.short_name || '';

  if (!city) return undefined;
  const parts = [city, st, cc].filter(Boolean);
  return {
    name: parts.join(', '),
    key: `${city}-${st}-${cc}`.toLowerCase(),
    countryCode: cc,
    adminCode: st,
    placeId
  };
}

export default function CityAutocomplete({ value, onChange, label = 'City', placeholder = 'Start typing a city…', country }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const psRef = useRef<google.maps.places.PlacesService | null>(null);
  const asRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // ensure services
  const ensureServices = useCallback(async () => {
    const g = await loadGoogleMaps();
    if (!psRef.current) psRef.current = new g.maps.places.PlacesService(document.createElement('div'));
    if (!asRef.current) asRef.current = new g.maps.places.AutocompleteService();
    return g;
  }, []);

  // Resolve free text on blur/enter (still useful)
  const resolveFreeText = useCallback(async () => {
    const el = inputRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text) { onChange(undefined); return; }

    const g = await ensureServices();
    const preds: google.maps.places.AutocompletePrediction[] = await new Promise((res) => {
      asRef.current!.getPlacePredictions(
        { input: text, types: ['(cities)'], ...(country ? { componentRestrictions: { country } as any } : {}) },
        (p) => res(p ?? [])
      );
    });
    if (!preds.length) { onChange(text); return; }

    const best = preds[0];
    psRef.current!.getDetails(
      { placeId: best.place_id!, fields: ['address_components','formatted_address','place_id'] },
      (pl, status) => {
        if (status === g.maps.places.PlacesServiceStatus.OK && pl) {
          const norm = buildCityFromComponents(pl.address_components!, pl.place_id!);
          const labelVal = norm?.name || pl.formatted_address || best.description || text;
          onChange(labelVal, { placeId: norm?.placeId, key: norm?.key, countryCode: norm?.countryCode, adminCode: norm?.adminCode });
          if (inputRef.current) inputRef.current.value = labelVal;
        } else {
          onChange(best.description || text, { placeId: best.place_id! });
          if (inputRef.current) inputRef.current.value = best.description || text;
        }
      }
    );
  }, [onChange, ensureServices, country]);

  // Init standard Autocomplete
  useEffect(() => {
    let cleanup = () => {};
    loadGoogleMaps().then((g) => {
      if (!inputRef.current) return;
      acRef.current = new g.maps.places.Autocomplete(inputRef.current!, {
        types: ['(cities)'],
        fields: ['address_components','formatted_address','place_id'],
        ...(country ? { componentRestrictions: { country } as any } : {}),
      });

      const listener = acRef.current.addListener('place_changed', async () => {
        const place = acRef.current!.getPlace();
        const placeId = place?.place_id;

        // If Google didn't include components, fetch details by place_id
        if (!place || !placeId) {
          // fallback to resolving whatever is in the input
          await resolveFreeText();
          return;
        }

        let components = place.address_components;
        let formatted = place.formatted_address;

        if (!components) {
          const g2 = await ensureServices();
          await new Promise<void>((done) => {
            psRef.current!.getDetails(
              { placeId, fields: ['address_components','formatted_address','place_id'] },
              (pl, status) => {
                if (status === g2.maps.places.PlacesServiceStatus.OK && pl) {
                  components = pl.address_components!;
                  formatted = pl.formatted_address!;
                }
                done();
              }
            );
          });
        }

        const norm = buildCityFromComponents(components!, placeId);
        const labelVal = norm?.name || formatted || inputRef.current!.value || '';
        onChange(labelVal || undefined, { placeId: norm?.placeId ?? placeId, key: norm?.key, countryCode: norm?.countryCode, adminCode: norm?.adminCode });
        if (inputRef.current) inputRef.current.value = labelVal;
        inputRef.current?.blur();
      });

      cleanup = () => g.maps.event.removeListener(listener);
    }).catch(() => {});
    return cleanup;
  }, [onChange, country, ensureServices, resolveFreeText]);

  // reflect external value
  useEffect(() => { if (inputRef.current) inputRef.current.value = value ?? ''; }, [value]);

  // handle Enter + Blur for manual text
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      resolveFreeText();
    }
  };

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm">{label}</label>
      <input
        ref={inputRef}
        defaultValue={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        onKeyDown={onKeyDown}
        onBlur={resolveFreeText}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2"
      />
    </div>
  );
}