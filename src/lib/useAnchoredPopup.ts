"use client";
import { useEffect, useState } from "react";

export function useAnchoredPopup(inputEl: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  
  useEffect(() => {
    if (!inputEl) return;
    const update = () => setRect(inputEl.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [inputEl]);
  
  return rect;
}
