import React from "react";

export function GoogleButton({ onClick, disabled }: {
onClick: () => void; disabled?: boolean;
}) {
return (
<button
type="button"
onClick={onClick}
disabled={disabled}
className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
aria-label="Continue with Google"
>
<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
<path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C33.9 31.8 29.5 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.9l5.1-5.1C33.2 7.3 28.8 5.5 24 5.5 12.7 5.5 3.5 14.7 3.5 26S12.7 46.5 24 46.5 44.5 37.3 44.5 26c0-1.9-.2-3.2-.9-5.5z"/>
<path fill="#FF3D00" d="M6.3 15.4l5.9 4.3C14 16 18.6 13 24 13c2.8 0 5.4 1.1 7.4 2.9l5.1-5.1C33.2 7.3 28.8 5.5 24 5.5 16 5.5 8.9 9.9 6.3 15.4z"/>
<path fill="#4CAF50" d="M24 46.5c5.4 0 10.3-1.9 14.1-5.2l-6.5-5.3C29.6 37.6 26.9 38.5 24 38.5c-5.5 0-10-3.4-11.6-8.1l-5.9 4.6C8.9 42.1 16 46.5 24 46.5z"/>
<path fill="#1976D2" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1 3-3.3 5.2-6.2 6.5l6.5 5.3c3.8-3.5 6.4-8.6 6.4-15.4 0-1.9-.2-3.2-.9-5.5z"/>
</svg>
<span>Continue with Google</span>
</button>
);
}
