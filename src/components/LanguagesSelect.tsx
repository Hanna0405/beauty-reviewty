'use client';
import React from 'react';
import MultiSelectAutocomplete from './MultiSelectAutocomplete';
import { LANGUAGES, type CatalogItem } from '@/catalog/languages';

export default function LanguagesSelect(props: {
  value: CatalogItem[];
  onChange: (v: CatalogItem[]) => void;
  required?: boolean;
}) {
  return (
    <MultiSelectAutocomplete
      label="Languages"
      items={LANGUAGES}
      value={props.value}
      onChange={props.onChange}
      required={props.required}
      max={5}
      placeholder="Type a language…"
    />
  );
}
