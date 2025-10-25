// --- threading util ---
export type ReviewItem = {
  id: string;
  isPublic?: boolean;
  publicCardId?: string | null;
  createdAt?: any; // Firestore Timestamp
  masterName?: string;
  cityKey?: string | null;
  text?: string;
  photos?: any[];
  rating?: number;
  // other fields are fine
};

export type Thread = {
  type: 'public-thread';
  head: ReviewItem;
  replies: ReviewItem[];
  lastActivityTs: number;
};

export type Flat = {
  type: 'flat';
  item: ReviewItem;
  lastActivityTs: number;
};

function ts(v: any): number {
  return v?.toMillis?.() ?? 0;
}
function keyOf(x: ReviewItem) {
  // Soft key to group heads without publicCardId: name + city
  return `${(x.masterName || '').toLowerCase()}|${(x.cityKey || '').toLowerCase()}`;
}

/**
 * Build threaded feed:
 * - Primary: group by publicCardId when it exists.
 * - Fallback: if several public docs have NO publicCardId but share masterName (+ city),
 * treat the earliest as head and rest as replies.
 * - Non-public are flat items.
 */
export function buildThreadedFeed(all: ReviewItem[]): Array<Thread | Flat> {
  const pub = all.filter(x => x.isPublic);
  const nonPub = all.filter(x => !x.isPublic);

  // Index heads by id (public & no publicCardId)
  const headsById: Record<string, ReviewItem> = {};
  for (const r of pub) {
    if (!r.publicCardId) headsById[r.id] = r;
  }

  // Replies by head id
  const repliesByHead: Record<string, ReviewItem[]> = {};
  for (const r of pub) {
    if (r.publicCardId) {
      (repliesByHead[r.publicCardId] ||= []).push(r);
    }
  }

  const threads: Thread[] = [];
  const usedHead = new Set<string>();

  // 1) Threads with explicit head present
  for (const headId of Object.keys(headsById)) {
    const head = headsById[headId];
    const reps = (repliesByHead[headId] || []).sort((a,b)=> ts(a.createdAt)-ts(b.createdAt));
    const lastTs = Math.max(ts(head.createdAt), ...reps.map(ts));
    threads.push({ type: 'public-thread', head, replies: reps, lastActivityTs: lastTs });
    usedHead.add(headId);
    delete repliesByHead[headId];
  }

  // 2) Orphan replies (their head not loaded by pagination) -> promote oldest reply to head
  for (const [pid, reps0] of Object.entries(repliesByHead)) {
    const reps = [...reps0].sort((a,b)=> ts(a.createdAt)-ts(b.createdAt));
    const syntheticHead = { ...reps[0], publicCardId: null };
    const rest = reps.slice(1);
    const lastTs = Math.max(...reps.map(ts));
    threads.push({ type: 'public-thread', head: syntheticHead, replies: rest, lastActivityTs: lastTs });
  }

  // 3) Fallback grouping: multiple "head-like" public docs with same masterName (+city)
  // and NO publicCardId — group them together.
  const headCandidates = pub.filter(r => !r.publicCardId);
  const bucket: Record<string, ReviewItem[]> = {};
  for (const r of headCandidates) (bucket[keyOf(r)] ||= []).push(r);

  for (const group of Object.values(bucket)) {
    if (group.length <= 1) continue; // nothing to group
    // sort by createdAt asc: earliest becomes head
    const sorted = group.sort((a,b)=> ts(a.createdAt)-ts(b.createdAt));
    const head = sorted[0];
    // if this head already in threads (explicit), skip
    if (threads.find(t => t.head.id === head.id)) continue;

    const replies = sorted.slice(1);
    if (!replies.length) continue;

    const lastTs = Math.max(...sorted.map(ts));
    // mark as a thread (soft)
    threads.push({ type: 'public-thread', head, replies, lastActivityTs: lastTs });
  }

  // 4) Flat items for non-public
  const flats: Flat[] = nonPub.map(item => ({ type: 'flat', item, lastActivityTs: ts(item.createdAt) }));

  // 5) Merge: threads + flats, desc by activity
  return [...threads, ...flats].sort((a,b)=> b.lastActivityTs - a.lastActivityTs);
}
