import React from "react";

export function StatusBadge({ status }: { status: "pending"|"confirmed"|"declined" }) {
 const map:any = {
 pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
 confirmed: "bg-green-100 text-green-800 ring-green-200",
 declined: "bg-red-100 text-red-800 ring-red-200",
 };
 const label = {pending:"Pending", confirmed:"Confirmed", declined:"Declined"}[status] || status;
 return (
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${map[status]}`}>
 {label}
 </span>
 );
}
