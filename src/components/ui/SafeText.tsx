import React from "react";
import { prettyValue } from "@/lib/prettyValue";

export function SafeText({ value, className }: { value: any; className?: string }) {
 const text = prettyValue(value);
 return <span className={className}>{text}</span>;
}
