"use client";
import React from "react";

/** No-op toast: calls are ignored, but API stays compatible. */
type ToastArgs = { message: string; duration?: number };
type ShowToastArgs = (message: string, type?: 'success' | 'error' | 'info') => void;

interface ToastAPI {
  push: (t: ToastArgs) => void;
  showToast: ShowToastArgs;
}

const noOp = () => {};
const ToastCtx = React.createContext<ToastAPI>({ 
  push: noOp,
  showToast: noOp 
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // We intentionally don't render any UI and don't change DOM.
  // If the app wraps with <ToastProvider>, it still just renders children.
  return <ToastCtx.Provider value={{ push: noOp, showToast: noOp }}>{children}</ToastCtx.Provider>;
}

export function useToast() {
  // Returns an object with no-op push() and showToast()
  return React.useContext(ToastCtx);
}

