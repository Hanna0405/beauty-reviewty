export type LuckyMessageEntry = {
  id: string;
  text: string;
};

/** Stable ids for share URLs: /skincare-checker?message=<id> */
export const LUCKY_MESSAGE_CATALOG: readonly LuckyMessageEntry[] = [
  { id: "beauty-is-not-perfection", text: "Beauty is not perfection." },
  { id: "never-meant-to-look-like-everyone", text: "You were never meant to look like everyone else." },
  { id: "gentle-reminder", text: "Maybe this is your reminder to be softer with yourself." },
  { id: "glow-in-your-own-way", text: "You are allowed to glow in your own way." },
  { id: "right-person-right-moment", text: "Some messages find the right person at the right moment." },
  { id: "found-you-for-a-reason", text: "This message found you for a reason" },
  { id: "dont-need-to-become-someone-else", text: "You don't need to become someone else to be beautiful." },
  { id: "not-everyone-unlocks-this", text: "Not everyone unlocks this message" },
  { id: "energy-changes-the-room", text: "Your energy changes the room before your appearance does." },
  { id: "lucky-universe-sent-you", text: "Lucky you. The universe sent you this today" },
  { id: "you-are-already-enough", text: "You are already enough." },
  { id: "sign-you-were-waiting-for", text: "Sometimes the sign you were waiting for is very small" },
  { id: "right-people-see-your-beauty", text: "The right people will always see your beauty." },
  { id: "soft-powerful", text: "Softness is power too." },
  { id: "deserve-beautiful-things", text: "A little reminder: you deserve beautiful things too." },
  { id: "rare-beautyreviewty-moment", text: "You unlocked a rare BeautyReviewty moment" },
  { id: "today-choose-yourself", text: "Maybe today is asking you to choose yourself." },
  { id: "you-are-becoming", text: "You are not late. You are becoming." },
  { id: "beauty-doesnt-need-permission", text: "Your beauty doesn't need permission." },
  { id: "stop-being-hard-on-yourself", text: "This is your little sign to stop being so hard on yourself." },
  { id: "soft-and-still-powerful", text: "You can be soft and still be powerful." },
  { id: "something-beautiful-becoming", text: "Something beautiful is still becoming in you." },
  { id: "dont-have-to-prove-beauty", text: "You don't have to prove your beauty." },
  { id: "glow-starts-without-comparing", text: "The glow starts when you stop comparing." },
  { id: "magic-already-visible", text: "Maybe your magic is already visible." },
  { id: "take-up-space-beautifully", text: "You are allowed to take up space beautifully." },
  { id: "let-yourself-feel-enough", text: "Today, let yourself feel enough." },
  { id: "more-magnetic-than-you-think", text: "You are more magnetic than you think." },
  { id: "message-chose-you-today", text: "This message chose you today." },
  { id: "doing-better-than-you-think", text: "A quiet reminder: you are doing better than you think." },
  { id: "softness-is-not-weakness", text: "Your softness is not weakness." },
  { id: "beauty-in-your-becoming", text: "There is beauty in your becoming." },
  { id: "allowed-to-be-seen", text: "You are allowed to be seen." },
  { id: "right-energy-finds-you", text: "The right energy always finds you." },
  { id: "presence-already-beautiful", text: "Your presence is already beautiful." },
  { id: "dont-chase-your-glow", text: "You don't need to chase your glow." },
  { id: "moment-to-believe-in-yourself", text: "Maybe this is your moment to believe in yourself." },
  { id: "someones-idea-of-beauty", text: "You are someone's idea of beauty." },
  { id: "beauty-not-meant-to-be-compared", text: "Your beauty is not meant to be compared." },
  { id: "rare-reminder-rare-girl", text: "A rare reminder for a rare girl" },
  { id: "already-unforgettable", text: "Something about you is already unforgettable." },
  { id: "feel-beautiful-today", text: "You are allowed to feel beautiful today." },
  { id: "glow-doesnt-look-like-anyone-else", text: "Your glow doesn't have to look like anyone else's." },
  { id: "message-meant-for-you", text: "Maybe this little message was meant for you." },
  { id: "your-skin-needs-rest", text: "You are becoming the version of yourself you once needed." },
] as const;

/** @deprecated Use LUCKY_MESSAGE_CATALOG — kept for any legacy imports */
export const SKINCARE_LUCKY_MESSAGES = LUCKY_MESSAGE_CATALOG.map((m) => m.text);

const MESSAGE_BY_ID = new Map(
  LUCKY_MESSAGE_CATALOG.map((entry) => [entry.id, entry] as const),
);

const STORAGE_KEY = "br_skincare_lucky_moment_v1";
const FORCE_DEBUG_STORAGE_KEY = "forceLuckyMessage";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** ~10% chance when cooldown allows (within 8–12% band). */
const TRIGGER_CHANCE = 0.1;

export const LUCKY_SHARE_PATH = "/skincare-checker";

/** Base skincare checker URL without message context (legacy). */
export const LUCKY_SHARE_URL = `https://beautyreviewty.com${LUCKY_SHARE_PATH}`;

export function normalizeLuckyMessageId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim().toLowerCase();
  return id.length > 0 ? id : null;
}

export function isValidLuckyMessageId(id: string): boolean {
  return MESSAGE_BY_ID.has(id);
}

export function getLuckyMessageById(id: string): LuckyMessageEntry | null {
  const normalized = normalizeLuckyMessageId(id);
  if (!normalized) return null;
  return MESSAGE_BY_ID.get(normalized) ?? null;
}

export function getLuckyShareBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${LUCKY_SHARE_PATH}`;
  }
  return LUCKY_SHARE_URL;
}

export function buildLuckyShareUrl(messageId: string): string {
  const normalized = normalizeLuckyMessageId(messageId);
  if (!normalized || !isValidLuckyMessageId(normalized)) {
    return getLuckyShareBaseUrl();
  }
  const params = new URLSearchParams({ message: normalized });
  return `${getLuckyShareBaseUrl()}?${params.toString()}`;
}

export function parseLuckyMessageFromSearch(search: string): LuckyMessageEntry | null {
  try {
    const id = normalizeLuckyMessageId(
      new URLSearchParams(search).get("message"),
    );
    if (!id) return null;
    return getLuckyMessageById(id);
  } catch {
    return null;
  }
}

export function isLuckyMessageDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(FORCE_DEBUG_STORAGE_KEY) === "true") {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("luckyMessage") === "1";
  } catch {
    return false;
  }
}

export function pickLuckyMessage(): LuckyMessageEntry {
  const i = Math.floor(Math.random() * LUCKY_MESSAGE_CATALOG.length);
  return LUCKY_MESSAGE_CATALOG[i] ?? LUCKY_MESSAGE_CATALOG[0];
}

export function shouldShowSkincareLuckyMoment(): boolean {
  if (typeof window === "undefined") return false;

  if (isLuckyMessageDebugMode()) {
    console.log("Lucky message forced debug mode");
    return true;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const last = parseInt(raw, 10);
      if (!Number.isNaN(last) && Date.now() - last < COOLDOWN_MS) {
        return false;
      }
    }
  } catch {
    return false;
  }
  return Math.random() < TRIGGER_CHANCE;
}

export function markSkincareLuckyMomentShown(): void {
  if (typeof window === "undefined") return;
  if (isLuckyMessageDebugMode()) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore quota / private mode */
  }
}

export function buildLuckyShareText(
  message: string,
  messageId?: string | null,
): string {
  const url = messageId
    ? buildLuckyShareUrl(messageId)
    : getLuckyShareBaseUrl();
  return `✨ I unlocked a rare BeautyReviewty message:

"${message}"

Maybe this was your sign too ✨

Check yours: ${url}`;
}
