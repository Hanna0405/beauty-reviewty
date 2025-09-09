import React from "react";

export default function AuthShell({ title, subtitle, children }: {
title: string;
subtitle?: string;
children: React.ReactNode;
}) {
return (
<div className="min-h-screen w-full bg-gradient-to-b from-white to-pink-50 flex items-center justify-center px-4">
<div className="w-full max-w-md">
<div className="text-center mb-6">
<h1 className="text-2xl font-semibold tracking-tight">BeautyReviewty</h1>
</div>
<div className="bg-white shadow-lg rounded-2xl p-6 border border-pink-100">
<div className="mb-5">
<h2 className="text-xl font-semibold">{title}</h2>
{subtitle ? (
<p className="text-sm text-gray-500 mt-1">{subtitle}</p>
) : null}
</div>
{children}
</div>
<p className="text-center text-[12px] text-gray-400 mt-6">
© {new Date().getFullYear()} BeautyReviewty
</p>
</div>
</div>
);
}
