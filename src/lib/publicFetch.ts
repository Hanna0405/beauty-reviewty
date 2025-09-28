import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase.client";

export async function fetchServicesSafe(): Promise<string[]> {
 try {
 const snap = await getDocs(collection(db, "services"));
 return snap.docs.map(d => (d.data().name as string)).filter(Boolean);
 } catch (e) {
 console.warn("services fetch failed", e);
 return [];
 }
}

export async function fetchCitiesSafe(): Promise<string[]> {
 try {
 const snap = await getDocs(collection(db, "cities"));
 return snap.docs.map(d => (d.data().name as string)).filter(Boolean);
 } catch (e) {
 console.warn("cities fetch failed", e);
 return [];
 }
}
