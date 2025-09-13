export function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function rankMatch(label: string, q: string) {
  const L = norm(label);
  const Q = norm(q);
  if (!Q) return -1;
  const i = L.indexOf(Q);
  if (i < 0) return -1;
  const starts = i === 0 ? 100 : 0;
  const shortBonus = Math.max(0, 40 - Math.min(40, L.length));
  return 50 - i + starts + shortBonus;
}

export function highlight(label: string, q: string) {
  const L = label;
  const Q = norm(q);
  if (!Q) return L;
  const idx = norm(L).indexOf(Q);
  if (idx < 0) return L;
  let out = '';
  let ni = 0;
  for (const ch of L) {
    const plain = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (ni === idx) out += '<mark>';
    out += ch;
    if (ni === idx + Q.length - 1) out += '</mark>';
    if (plain) ni += 1;
  }
  return out;
}
