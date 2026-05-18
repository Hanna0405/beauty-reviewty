'use client';
import { useEffect, useMemo, useState } from 'react';

export type Option = { id: string; title: string; city?: string; services?: string[]; photoUrl?: string };

function labelFromValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const item = value as { name?: string; title?: string; label?: string; key?: string };
    return item.name || item.title || item.label || item.key || '';
  }
  return String(value);
}

function cityLabel(city: Option['city']): string {
  if (!city) return '';
  if (typeof city === 'string') return city;
  if (typeof city === 'object' && city !== null) {
    const item = city as { formatted?: string; city?: string; name?: string };
    return item.formatted || item.city || item.name || '';
  }
  return String(city);
}

export default function AutocompleteList({
  value,
  onSelect,
  options,
  selectedId = null,
  placeholder = 'Search by name, city, or service…',
  maxVisible = 8,
}: {
  value: string;
  onSelect: (opt: Option) => void;
  options: Option[];
  selectedId?: string | null;
  placeholder?: string;
  maxVisible?: number;
}) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);

  const hasSelection = Boolean(selectedId);
  const ql = (q || '').trim().toLowerCase();
  const isSearching = ql.length > 0;

  const filtered = useMemo(() => {
    if (hasSelection) return [];
    if (!ql) return options.slice(0, maxVisible);

    return options
      .filter((o) => {
        const title = (o.title || '').toLowerCase();
        const city = cityLabel(o.city).toLowerCase();
        const servicesArr = Array.isArray(o.services) ? o.services : [];
        const serviceHit = servicesArr.some((sv) =>
          labelFromValue(sv).toLowerCase().includes(ql)
        );

        return title.includes(ql) || city.includes(ql) || serviceHit;
      })
      .slice(0, maxVisible);
  }, [ql, options, maxVisible, hasSelection]);

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border p-2"
      />
      {!hasSelection && (
        <div className="rounded border divide-y max-h-72 overflow-auto bg-white">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelect(o)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
              >
                {o.photoUrl ? (
                  <img
                    src={o.photoUrl}
                    alt=""
                    className="h-10 w-14 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-14 bg-gray-100 rounded" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {cityLabel(o.city) || '—'} •{' '}
                    {(o.services || [])
                      .map(labelFromValue)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(', ')}
                  </div>
                </div>
              </button>
            ))
          ) : isSearching ? (
            <div className="px-3 py-2 text-gray-500 text-sm">Nothing found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
