import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { whenText } from "@/lib/when";
import { Avatar } from "@/components/ui/Avatar";
import { useUnreadChatMap } from "@/components/notifications/useUnreadChatMap";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
 item: any;
 role: "master"|"client";
 onAction: (id:string, action:"confirm"|"decline"|"delete") => void;
};

export function BookingCard({ item: b, role, onAction }: Props) {
 const when = whenText(b);
 const listingLink = b._listing ? `/listing/${b._listing.slug || b.listingId}` : `/listing/${b.listingId}`;
 const clientContact = [b.contactName, b.contactPhone].filter(Boolean).join(", ");
 const { user } = useAuth();
 const { byBooking } = useUnreadChatMap(user?.uid);
 const unread = byBooking[b.id] || 0;
 return (
 <li className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex gap-4">
 <Avatar name={role==="master" ? (b.contactName || "Client") : "Master"} />
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-3">
 <StatusBadge status={(b.status||"pending")} />
 <div className="font-semibold">{when}</div>
 <div className="text-sm text-gray-500">• {b.durationMin} min</div>
 </div>
 <a className="text-pink-600 hover:underline text-sm" href={listingLink} target="_blank" rel="noreferrer">
 {b._listing?.title || "Open listing"}
 </a>
 </div>

 <div className="mt-2 text-sm text-gray-700 break-words">
 <div>
 <span className="text-gray-500">Master:</span>
 {" "}
 <a className="text-pink-600 hover:underline" href={`/masters/${b.masterId}`} target="_blank" rel="noreferrer">
 {b.masterId}
 </a>
 </div>
 <div><span className="text-gray-500">Client:</span> {b.clientId || "guest"}</div>
 {clientContact && <div><span className="text-gray-500">Client contact:</span> {clientContact}</div>}
 {b.note && <div className="mt-1"><span className="text-gray-500">Note:</span> {b.note}</div>}
 </div>

 <div className="mt-3 flex items-center gap-2">
 <a className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white relative"
 href={`/dashboard/chat?booking=${encodeURIComponent(b.id)}`}>
 Open chat
 {unread ? <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-[11px] leading-none px-1.5 py-0.5">{unread}</span> : null}
 </a>
 {role === "master" ? (
 <>
 {b.status !== "confirmed" && <Button tone="success" onClick={()=>onAction(b.id,"confirm")}>Confirm</Button>}
 {b.status !== "declined" && <Button tone="warning" onClick={()=>onAction(b.id,"decline")}>Decline</Button>}
 <Button tone="danger" onClick={()=>onAction(b.id,"delete")}>Delete</Button>
 </>
 ) : (
 <span className="text-sm text-gray-600">
 {b.status === "pending" ? "Waiting for confirmation" : b.status === "confirmed" ? "Confirmed" : "Declined"}
 </span>
 )}
 </div>
 </div>
 </li>
 );
}
