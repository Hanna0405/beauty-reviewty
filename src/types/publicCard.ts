export interface PublicCard {
  id: string; // Firestore doc id
  slug?: string; // stable slug if we use slugs
  cityKey?: string; // matches our CityAutocomplete pattern
  title?: string; // display name ("Alla")
  // other existing fields...
}
