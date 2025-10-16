"use client";
import React, { useEffect, useRef, useState } from "react";
import { cityToDisplay } from "@/lib/city/format";

type Props = {
  value: any; // Can be string, object, or null
  onChange: (v: string) => void;
  placeholder?: string;
  autoOpenOnType?: boolean;
  autoCloseOnSelect?: boolean;
};
export default function CityAutocompleteNew({ 
  value, 
  onChange, 
  placeholder,
  autoOpenOnType = false,
  autoCloseOnSelect = false 
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(cityToDisplay(value));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const safeValue = cityToDisplay(value);
    setInputValue(safeValue);
  }, [value]);

  useEffect(() => {
    if (autoOpenOnType) {
      const len = (inputValue ?? '').length;
      setIsOpen(len > 0);
    }
  }, [autoOpenOnType, inputValue]);

  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null;
    let t: any;

    function init() {
      // Google script is loaded by GoogleMapsProvider. Just wait for it.
      if (typeof window === "undefined" || !window.google?.maps?.places) {
        t = setTimeout(init, 50);
        return;
      }
      if (!inputRef.current) return;
      
      ac = new google.maps.places.Autocomplete(inputRef.current!, {
        types: ["(cities)"],
        fields: ["formatted_address", "address_components", "geometry"],
        componentRestrictions: { country: ["ca"] },
      });
      
      ac.addListener("place_changed", () => {
        const p = ac!.getPlace();
        const label = p.formatted_address || inputRef.current!.value;
        setInputValue(label);
        onChange(label);
        
        if (autoCloseOnSelect) {
          setIsOpen(false);
          inputRef.current!.blur();
        }
      });
    }

    init();
    return () => {
      if (t) clearTimeout(t);
      if (ac) google.maps.event.clearInstanceListeners(ac);
    };
  }, [onChange, autoCloseOnSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ?? '';
    setInputValue(newValue);
    onChange(newValue);
    
    if (autoOpenOnType) {
      const len = (newValue ?? '').length;
      setIsOpen(len > 0);
    }
  };

  return (
    <input
      ref={inputRef}
      value={inputValue ?? ''}
      placeholder={placeholder ?? "Start typing your city"}
      className="w-full rounded border px-3 py-2"
      onChange={handleInputChange}
      onFocus={() => {
        const len = (inputValue ?? '').length;
        if (autoOpenOnType && len > 0) {
          setIsOpen(true);
        }
      }}
      onBlur={() => {
        // Delay closing to allow click events to fire
        setTimeout(() => setIsOpen(false), 150);
      }}
    />
  );
}
