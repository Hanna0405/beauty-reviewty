"use client";
import React, { useEffect, useState } from "react";

type ToastProps = {
 message: string;
 type?: "success" | "error" | "info";
 duration?: number;
 onClose: () => void;
};

export default function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
 const [isVisible, setIsVisible] = useState(true);

 useEffect(() => {
  const timer = setTimeout(() => {
   setIsVisible(false);
   setTimeout(onClose, 300); // Wait for animation to complete
  }, duration);

  return () => clearTimeout(timer);
 }, [duration, onClose]);

 const getToastStyles = () => {
  switch (type) {
   case "success":
    return "bg-green-500 text-white";
   case "error":
    return "bg-red-500 text-white";
   case "info":
    return "bg-blue-500 text-white";
   default:
    return "bg-pink-500 text-white";
  }
 };

 return (
  <div
   className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
   } ${getToastStyles()}`}
  >
   <div className="flex items-center gap-2">
    <span>{message}</span>
    <button
     onClick={() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
     }}
     className="ml-2 text-white hover:text-gray-200"
    >
     ×
    </button>
   </div>
  </div>
 );
}

// Toast context for global usage
type ToastContextType = {
 showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
};

export const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
 const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info"; duration: number }>>([]);

 const showToast = (message: string, type: "success" | "error" | "info" = "success", duration: number = 3000) => {
  const id = Math.random().toString(36).substr(2, 9);
  setToasts(prev => [...prev, { id, message, type, duration }]);
 };

 const removeToast = (id: string) => {
  setToasts(prev => prev.filter(toast => toast.id !== id));
 };

 return (
  <ToastContext.Provider value={{ showToast }}>
   {children}
   {toasts.map(toast => (
    <Toast
     key={toast.id}
     message={toast.message}
     type={toast.type}
     duration={toast.duration}
     onClose={() => removeToast(toast.id)}
    />
   ))}
  </ToastContext.Provider>
 );
}

export function useToast() {
 const context = React.useContext(ToastContext);
 if (!context) {
  throw new Error("useToast must be used within a ToastProvider");
 }
 return context;
}