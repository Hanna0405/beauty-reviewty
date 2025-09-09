import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
label: string;
error?: string;
};

export function Field({ label, error, className, ...rest }: Props) {
return (
<label className="block mb-4">
<span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
<input
{...rest}
className={
"w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none " +
"focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition " +
(className || "")
}
/>
{error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
</label>
);
}
