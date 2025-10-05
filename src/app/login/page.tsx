'use client';
import { Suspense } from 'react';
import AuthForm from "@/components/AuthForm";
import AuthShell from "@/components/AuthShell";

function LoginInner() {
 return (
 <AuthShell mode="login">
 <AuthForm mode="login" />
 </AuthShell>
 );
}

export default function Page() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <LoginInner />
 </Suspense>
 );
}