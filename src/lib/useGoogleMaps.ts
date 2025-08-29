"use client";

import { useEffect, useState } from "react";

declare global {
 interface Window {
 _gmapsLoader?: Promise<void>;
 }
}

export function useGoogleMaps() {
 const [ready, setReady] = useState<boolean>(typeof window !== "undefined" && !!(window as any).google);

 useEffect(() => {
 if (ready) return;

 // если уже грузили – переиспользуем
 if (window._gmapsLoader) {
 window._gmapsLoader.then(() => setReady(true));
 return;
 }

 const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
 if (!apiKey) {
 console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing");
 return;
 }

 window._gmapsLoader = new Promise<void>((resolve) => {
 const s = document.createElement("script");
 s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
 s.async = true;
 s.onload = () => {
 setReady(true);
 resolve();
 };
 document.body.appendChild(s);
 });
 }, [ready]);

 return ready;
}