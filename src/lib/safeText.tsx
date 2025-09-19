import React from 'react';

type AnyVal = unknown;

export function toDisplayText(v: AnyVal): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);

  if (Array.isArray(v)) {
    const parts = v.map((item) => {
      if (item == null) return '';
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (typeof item === 'object') {
        const o = item as any;
        return (
          o.formatted ||
          o.name ||
          o.title ||
          o.label ||
          o.value ||
          o.city ||
          o.placeName ||
          ''
        );
      }
      return '';
    }).filter(Boolean);
    return parts.join(', ');
  }

  if (typeof v === 'object') {
    const o = v as any;
    return (
      o.formatted ||
      o.name ||
      o.title ||
      o.label ||
      o.value ||
      o.city ||
      o.placeName ||
      ''
    );
  }

  return '';
}

export function SafeText({ value, className }: { value: AnyVal; className?: string }) {
  return <span className={className}>{toDisplayText(value)}</span>;
}
