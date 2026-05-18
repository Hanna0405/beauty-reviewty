/** Shared read-side filters for master reviews (no write logic). */

export function isApprovedReviewStatus(
  data: Record<string, unknown>
): boolean {
  const status = data.status;
  if (status == null || status === "") return true;
  return String(status).toLowerCase() === "approved";
}

export function getReviewSubjectType(
  data: Record<string, unknown>
): string | null {
  const nested = data.subject as { type?: string } | undefined;
  const subjectType = data.subjectType ?? nested?.type;
  return subjectType ? String(subjectType).toLowerCase() : null;
}

export function isMasterSubjectReview(data: Record<string, unknown>): boolean {
  return getReviewSubjectType(data) === "master";
}

export function reviewMasterIds(data: Record<string, unknown>): string[] {
  const nested = data.subject as { id?: string } | undefined;
  return [
    data.masterId,
    data.subjectId,
    data.profileId,
    nested?.id,
  ]
    .filter(Boolean)
    .map((id) => String(id).trim());
}

export function reviewMatchesMasterId(
  data: Record<string, unknown>,
  masterIds: string[]
): boolean {
  if (!masterIds.length) return true;
  const normalized = new Set(masterIds.map((id) => id.trim()).filter(Boolean));
  return reviewMasterIds(data).some((id) => normalized.has(id));
}

/** Approved review with subjectType master (for /reviewty feed). */
export function isApprovedMasterReviewForFeed(
  data: Record<string, unknown>
): boolean {
  if (!isApprovedReviewStatus(data)) return false;
  if (!isMasterSubjectReview(data)) return false;
  return Boolean(reviewMasterIds(data).length || data.masterName || data.text);
}

/** Approved master review for a specific master profile. */
export function isApprovedMasterReviewForProfile(
  data: Record<string, unknown>,
  masterIds: string[]
): boolean {
  if (!isApprovedReviewStatus(data)) return false;

  if (isMasterSubjectReview(data)) {
    return reviewMatchesMasterId(data, masterIds);
  }

  return false;
}

/** Approved review counted toward /masters aggregate for a master uid/id. */
export function isApprovedMasterReviewForAggregation(
  data: Record<string, unknown>,
  listingOwnerMap: Map<string, string>
): string | null {
  if (!isApprovedReviewStatus(data)) return null;

  if (isMasterSubjectReview(data)) {
    const masterId =
      String(data.masterId || data.subjectId || data.profileId || "").trim() ||
      null;
    return masterId;
  }

  const listingId =
    data.listingId ||
    (getReviewSubjectType(data) === "listing" ? data.subjectId : null);
  if (listingId) {
    const owner = listingOwnerMap.get(String(listingId));
    return owner || null;
  }

  return null;
}
