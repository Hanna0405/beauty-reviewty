import { getAdminDb } from "@/lib/firebaseAdmins";

export type PublicCardRecord = Record<string, unknown> & { id: string };

export async function loadPublicCard(
  id: string
): Promise<PublicCardRecord | null> {
  const db = getAdminDb();
  const ref = db.collection("publicCards").doc(id);

  try {
    const snap = await ref.get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    console.error("[loadPublicCard] Error loading card:", error);
    throw error;
  }

  return null;
}
