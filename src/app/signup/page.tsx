import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";

export default function Page() {
 return (
 <AuthShell mode="signup">
 <AuthForm mode="signup" variant="emailOnly" />
 </AuthShell>
 );
}