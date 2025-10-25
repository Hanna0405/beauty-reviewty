export function buildPublicThreadKey(cityKey: string, masterName: string) {
  const ck = (cityKey || '').trim().toLowerCase();
  const ms = (masterName || '').trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 80);
  if (!ck || !ms) throw new Error('[public-card] Missing cityKey or masterName for threadKey');
  return `pc_${ck}_${ms}`;
}
