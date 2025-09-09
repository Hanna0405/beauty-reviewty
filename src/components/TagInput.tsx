"use client";

import { useState, KeyboardEvent } from "react";

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export default function TagInput({ label, value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (t: string) => {
    const tag = t.trim();
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(draft);
    }
  };

  const remove = (t: string) => onChange(value.filter(v => v !== t));

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full border px-2 py-1 text-sm"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="ml-2 text-xs opacity-60 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder={placeholder ?? "Type and press Enter"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="text-xs text-muted-foreground">
        Press Enter to add. Click ✕ to remove.
      </div>
    </div>
  );
}
