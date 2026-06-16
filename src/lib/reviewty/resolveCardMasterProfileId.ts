/** Resolve a master profile id from publicCards / Reviewty card fields. */
export function resolveCardMasterProfileId(
  data: Record<string, unknown>,
  cardId?: string
): string | null {
  const direct = [
    data.masterId,
    data.masterUid,
    data.profileId,
  ]
    .map((v) => String(v || "").trim())
    .find(Boolean);

  if (direct) return direct;

  const masterRef = data.masterRef as { id?: string } | undefined;
  if (masterRef?.id) {
    const refId = String(masterRef.id).trim();
    if (refId) return refId;
  }

  const slug = String(cardId || data.id || "").trim();
  if (slug.startsWith("master_")) {
    const fromSlug = slug.slice("master_".length).trim();
    if (fromSlug) return fromSlug;
  }

  return null;
}
