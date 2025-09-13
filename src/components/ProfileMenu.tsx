import { useAuth } from "@/context/AuthContext";
export default function ProfileMenu(){
  const { user } = useAuth();
  return (
    <div className="px-3 py-2">
      <div className="font-medium">{user?.displayName ?? user?.email ?? "User"}</div>
      <div className="text-sm text-muted-foreground">Role: {user?.role ?? "client"}</div>
    </div>
  );
}
