export type AppUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: "master" | "client" | "admin";
  createdAt?: any;
  updatedAt?: any;
};
