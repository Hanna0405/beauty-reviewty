import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary"|"success"|"warning"|"danger"|"neutral" };

export function Button({ tone="primary", className="", ...rest }: Props) {
 const map:any = {
 primary: "bg-pink-500 hover:bg-pink-600 text-white",
 success: "bg-green-500 hover:bg-green-600 text-white",
 warning: "bg-amber-500 hover:bg-amber-600 text-white",
 danger: "bg-red-500 hover:bg-red-600 text-white",
 neutral: "bg-gray-200 hover:bg-gray-300 text-gray-900",
 };
 return <button {...rest} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${map[tone]} ${className}`} />;
}
