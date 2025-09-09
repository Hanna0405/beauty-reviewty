import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";

export default function Page() {
 return (
 <AuthShell mode="login">
 <AuthForm mode="login" />
 </AuthShell>
 );
}