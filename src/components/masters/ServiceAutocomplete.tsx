'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { norm, rankMatch, highlight } from '@/lib/text-normalize';
import type { ServiceGroup, ServiceOption } from '@/constants/services';
import { findServiceLabel } from '@/constants/services';

type Props = {
  /** selected values (leaf service ids) */
  value: string[];
  onChange: (v: string[]) => void;
  groups: ServiceGroup[]; // pass SERVICE_GROUPS
  placeholder?: string;
  max?: number;
};

type Ranked = { groupId: string; groupLabel: string; groupIcon?: string; option: ServiceOption; score: number };

export default function ServiceAutocomplete({ value, onChange, groups, placeholder='Type to search services…', max=10 }: Props) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<Ranked[]>([]);
  const tRef = useRef<any>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  useEffect(() => {
    clearTimeout(tRef.current);
    const q = input.trim();
    if (q.length < 1) { setItems([]); setOpen(false); return; }

    tRef.current = setTimeout(() => {
      const ranked: Ranked[] = [];
      for (const g of groups) {
        for (const o of g.children) {
          if (selectedSet.has(o.value)) continue;
          const label = o.label;
          const keys = (o.keywords ?? []).join(' ');
          const score = Math.max(rankMatch(label, q), rankMatch(keys, q));
          if (score >= 0) ranked.push({ groupId: g.id, groupLabel: g.label, groupIcon: g.icon, option: o, score });
          // allow searching by group name too
          const gScore = rankMatch(g.label, q);
          if (gScore >= 120) ranked.push({ groupId: g.id, groupLabel: g.label, groupIcon: g.icon, option: o, score: gScore - 20 });
        }
      }
      ranked.sort((a,b) => b.score - a.score);
      setItems(ranked.slice(0, 20));
      setOpen(ranked.length > 0);
      setActive(0);
    }, 200);
  }, [input, groups, selectedSet]);

  function add(opt: ServiceOption) {
    if (value.length >= max) return;
    onChange([...value, opt.value]);
    setInput('');
    setOpen(false);
  }
  function remove(val: string) { onChange(value.filter(v => v !== val)); }

  // Group visible results for rendering sections
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; icon?: string; rows: Ranked[] }>();
    for (const r of items) {
      if (!map.has(r.groupId)) map.set(r.groupId, { label: r.groupLabel, icon: r.groupIcon, rows: [] });
      map.get(r.groupId)!.rows.push(r);
    }
    return Array.from(map.entries()).map(([id, v]) => ({ id, label: v.label, labelIcon: v.icon, rows: v.rows }));
  }, [items]);

  // For keyboard selection we flatten again
  const flat = items;

  return (
    <div className="relative">
      {/* chips */}
      <div className="mb-1 flex flex-wrap gap-1">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded bg-pink-100 px-2 py-1 text-sm">
            {findServiceLabel(v)}
            <button type="button" onClick={() => remove(v)} aria-label="Remove">×</button>
          </span>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => { if (items.length) setOpen(true); }}
        onKeyDown={(e) => {
          if (!open || flat.length === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i+1, flat.length-1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i-1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); add(flat[active].option); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2"
        autoComplete="off"
      />

      {open && grouped.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-white shadow">
          {grouped.map((g) => (
            <div key={g.id}>
              <div className="bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                {g.labelIcon ? `${g.labelIcon} ${g.label}` : g.label}
              </div>
              <ul>
                {g.rows.map((r, i) => {
                  const idx = flat.findIndex(f => f === r);
                  return (
                    <li
                      key={r.option.value}
                      className={`cursor-pointer px-3 py-2 ${idx===active ? 'bg-gray-100' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => add(r.option)}
                      dangerouslySetInnerHTML={{ __html: highlight(r.option.label, input) }}
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
