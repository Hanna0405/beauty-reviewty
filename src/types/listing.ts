import { Timestamp } from "firebase/firestore";
export type Listing = {
 id?: string;
 uid: string;
 ownerId?: string; // uid of the listing owner (master)
 profileId?: string; // alternative field name for owner
 title: string;
 description?: string;
 city: string;
 services: string[];
 languages: string[];
 minPrice?: number;
 maxPrice?: number;
 photos: string[]; // download URLs
 status: "active" | "hidden";
 createdAt?: Timestamp;
 updatedAt?: Timestamp;
 };
