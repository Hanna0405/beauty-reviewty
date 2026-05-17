import { doc, getDoc, type Firestore } from "firebase/firestore";

export const MASTER_PROFILE_EDIT_PATH = "/dashboard/master/profile/edit";
export const MASTER_LISTING_NEW_PATH = "/dashboard/master/listings/new";
export const MASTER_DASHBOARD_PATH = "/dashboard/master";

export function masterProfileEditUrl(onboarding = false): string {
  return onboarding
    ? `${MASTER_PROFILE_EDIT_PATH}?onboarding=1`
    : MASTER_PROFILE_EDIT_PATH;
}

export async function hasActiveMasterProfile(
  db: Firestore,
  uid: string
): Promise<boolean> {
  const profileSnap = await getDoc(doc(db, "profiles", uid));
  if (!profileSnap.exists()) return false;

  const masterSnap = await getDoc(doc(db, "masters", uid));
  if (masterSnap.exists() && masterSnap.data()?.deleted === true) {
    return false;
  }

  return true;
}

export async function getMasterPostAuthRedirect(
  db: Firestore,
  uid: string,
  role: string | undefined | null
): Promise<string> {
  if (role !== "master") return "/";
  const active = await hasActiveMasterProfile(db, uid);
  if (!active) return masterProfileEditUrl(true);
  return MASTER_DASHBOARD_PATH;
}
