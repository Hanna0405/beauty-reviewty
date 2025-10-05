'use client';
import React from 'react';
import MultiSelectAutocomplete from './MultiSelectAutocomplete';
import { SERVICES, type CatalogItem } from '@/catalog/services';

export default function ServicesSelect({ value, onChange, required }: { value: CatalogItem[]; onChange: (v: CatalogItem[]) => void; required?: boolean; }) {
  return <MultiSelectAutocomplete label="Services" items={SERVICES} value={value} onChange={onChange} required={required} max={10} placeholder="Type a service…" />;
}