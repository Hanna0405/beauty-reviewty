export type MasterLike = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  phone?: string | null;
  city?: string | null;
  services?: string[] | null;
  languages?: string[] | null;
};

export function buildMasterDisplay(m: MasterLike): { display: string; keywords: string[] } {
  const name =
    (m.displayName && m.displayName.trim()) ||
    ([m.firstName, m.lastName].filter(Boolean).join(" ").trim()) ||
    (m.nickname && m.nickname.trim()) ||
    (m.phone && maskPhone(m.phone)) ||
    "Unknown";

  function maskPhone(p?: string | null) {
    if (!p) return "";
    const digits = p.replace(/\D+/g, "");
    if (digits.length < 7) return p;
    return `+${digits.slice(0,2)} *** ${digits.slice(-4)}`; // simple mask
  }

  const rawTokens: string[] = [];
  if (m.displayName) rawTokens.push(m.displayName);
  if (m.firstName) rawTokens.push(m.firstName);
  if (m.lastName) rawTokens.push(m.lastName);
  if (m.nickname) rawTokens.push(m.nickname);
  if (m.phone) rawTokens.push(m.phone.replace(/\D+/g, "")); // pure digits for search by phone

  const tokens = Array.from(
    new Set(
      rawTokens
        .flatMap(t => t.split(/[\s\-_]+/))
        .map(t => t.toLowerCase())
        .filter(Boolean)
    )
  );

  return { display: name, keywords: tokens };
}
