export type CityRef = { name: string; lat: number; lng: number };

export type Listing = {
 id?: string;
 uid: string;
 title: string;
 city: CityRef | null; // store object
 services: string[]; // chip list
 languages: string[]; // chip list
 priceMin?: number | null;
 priceMax?: number | null;
 description?: string;
 photos?: string[];
 status?: "active" | "hidden";
 createdAt?: any;
 updatedAt?: any;
};
