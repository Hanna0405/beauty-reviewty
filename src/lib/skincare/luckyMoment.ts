export const SKINCARE_LUCKY_MESSAGES = [
  "Beauty is not perfection.",
  "You were never meant to look like everyone else.",
  "Maybe this is your reminder to be softer with yourself.",
  "You are allowed to glow in your own way.",
  "Some messages find the right person at the right moment.",
  "This message found you for a reason",
  "You don't need to become someone else to be beautiful.",
  "Not everyone unlocks this message",
  "Your energy changes the room before your appearance does.",
  "Lucky you. The universe sent you this today",
  "You are already enough.",
  "Sometimes the sign you were waiting for is very small",
  "The right people will always see your beauty.",
  "Softness is power too.",
  "A little reminder: you deserve beautiful things too.",
  "You unlocked a rare BeautyReviewty moment",
  "Maybe today is asking you to choose yourself.",
  "You are not late. You are becoming.",
  "Your beauty doesn't need permission.",
  "This is your little sign to stop being so hard on yourself.",
  "You can be soft and still be powerful.",
  "Something beautiful is still becoming in you.",
  "You don't have to prove your beauty.",
  "The glow starts when you stop comparing.",
  "Maybe your magic is already visible.",
  "You are allowed to take up space beautifully.",
  "Today, let yourself feel enough.",
  "You are more magnetic than you think.",
  "This message chose you today.",
  "A quiet reminder: you are doing better than you think.",
  "Your softness is not weakness.",
  "There is beauty in your becoming.",
  "You are allowed to be seen.",
  "The right energy always finds you.",
  "Your presence is already beautiful.",
  "You don't need to chase your glow.",
  "Maybe this is your moment to believe in yourself.",
  "You are someone's idea of beauty.",
  "Your beauty is not meant to be compared.",
  "A rare reminder for a rare girl",
  "Something about you is already unforgettable.",
  "You are allowed to feel beautiful today.",
  "Your glow doesn't have to look like anyone else's.",
  "Maybe this little message was meant for you.",
  "You are becoming the version of yourself you once needed.",
] as const;

const STORAGE_KEY = "br_skincare_lucky_moment_v1";
const FORCE_DEBUG_STORAGE_KEY = "forceLuckyMessage";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** ~10% chance when cooldown allows (within 8–12% band). */
const TRIGGER_CHANCE = 0.1;

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

export function pickLuckyMessage(): string {
  const i = Math.floor(Math.random() * SKINCARE_LUCKY_MESSAGES.length);
  return SKINCARE_LUCKY_MESSAGES[i] ?? SKINCARE_LUCKY_MESSAGES[0];
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

export const LUCKY_SHARE_URL = "https://beautyreviewty.com/skincare-checker";

export function buildLuckyShareText(message: string): string {
  return `✨ I unlocked a rare BeautyReviewty message:

"${message}"

Maybe this was your sign too ✨

Check yours: ${LUCKY_SHARE_URL}`;
}
