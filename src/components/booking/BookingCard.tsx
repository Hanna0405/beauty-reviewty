import React from "react";
import Link from "next/link";
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
 const chatId =
  b.masterUid && (b.clientId || b.clientUid)
    ? `${b.masterUid}_${b.clientId || b.clientUid}`
    : null;
 const statusTone =
  b.status === "confirmed"
    ? "bg-green-100 text-green-700"
    : b.status === "declined"
    ? "bg-red-100 text-red-600"
    : "bg-yellow-50 text-yellow-700";
  return (
    <li className="w-full">
      <div className="rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition p-4 bg-white flex gap-4">
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
              <span className="text-gray-500">Master:</span>{" "}
              <a className="text-pink-600 hover:underline" href={`/masters/${b.masterId}`} target="_blank" rel="noreferrer">
                {b.masterId}
              </a>
            </div>
            <div><span className="text-gray-500">Client:</span> {b.clientId || "guest"}</div>
            {clientContact && <div><span className="text-gray-500">Client contact:</span> {clientContact}</div>}
            {b.note && <div className="mt-1"><span className="text-gray-500">Note:</span> {b.note}</div>}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {chatId ? (
              <Link
                href={`/dashboard/chat/${chatId}`}
                className="inline-flex items-center gap-1 rounded-lg bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 hover:bg-pink-200 transition relative"
              >
                Chat
                {unread ? (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full text-[11px] leading-none px-1.5 py-0.5">
                    {unread}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {role === "master" ? (
              <>
                {b.status !== "confirmed" && <Button tone="success" onClick={()=>onAction(b.id,"confirm")}>Confirm</Button>}
                {b.status !== "declined" && <Button tone="warning" onClick={()=>onAction(b.id,"decline")}>Decline</Button>}
                <Button tone="danger" onClick={()=>onAction(b.id,"delete")}>Delete</Button>
              </>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusTone}`}>
                {b.status || "pending"}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
 );
}
