"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  increment,
} from "firebase/firestore";

type BookingDoc = {
  clientId: string;
  masterId?: string;
  masterUid?: string;
  unreadForMaster?: number;
  unreadForClient?: number;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt?: any;
};

export default function BookingChatPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = (params?.chatId || params?.id) as string;
  const { user } = useAuth();
  const userId = user?.uid;
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    const ref = doc(db, "bookings", bookingId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBooking(snap.data() as BookingDoc);
      } else {
        setBooking(null);
      }
    });
    return () => unsub();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    const msgCol = collection(db, "bookings", bookingId, "messages");
    const q = query(msgCol, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMessages(data);
    });
    return () => unsub();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId || !booking || !userId) return;
    const master = booking.masterUid ?? booking.masterId;
    const isMaster = master === userId;
    const ref = doc(db, "bookings", bookingId);
    updateDoc(ref, {
      ...(isMaster ? { unreadForMaster: 0 } : { unreadForClient: 0 }),
    }).catch(() => {});
  }, [bookingId, booking, userId]);

  async function handleSend() {
    if (!input.trim() || !bookingId || !userId || !booking) return;

    const master = booking.masterUid ?? booking.masterId;
    const isMaster = master === userId;

    const msgCol = collection(db, "bookings", bookingId, "messages");
    await addDoc(msgCol, {
      text: input.trim(),
      senderId: userId,
      createdAt: serverTimestamp(),
    });

    const bookingRef = doc(db, "bookings", bookingId);
    if (isMaster) {
      await updateDoc(bookingRef, {
        unreadForClient: increment(1),
      }).catch(() => {});
    } else {
      await updateDoc(bookingRef, {
        unreadForMaster: increment(1),
      }).catch(() => {});
    }

    // Send email notification (best-effort, non-blocking)
    fetch("/api/booking/message/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        senderId: userId,
        messageText: input.trim(),
      }),
    }).catch((err) => {
      console.error("[chat] failed to notify email", err);
    });

    setInput("");
  }

  function formatMessageTime(m: ChatMessage) {
    if (!m.createdAt) return "";
    if (typeof m.createdAt.toDate === "function") {
      const d = m.createdAt.toDate();
      return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
    if (m.createdAt instanceof Date) {
      return m.createdAt.toLocaleDateString() + " " + m.createdAt.toLocaleTimeString();
    }
    return "";
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-3">
        <button
          onClick={() => router.push("/dashboard/master/bookings")}
          className="text-sm text-pink-500 hover:underline"
        >
          ← Back to bookings
        </button>
      </div>
      <div className="bg-white/80 rounded-lg border flex flex-col h-[70vh]">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">Chat</div>
          <div className="text-xs text-gray-400">
            {bookingId ? `booking: ${bookingId.slice(0, 6)}…` : ""}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="text-sm text-gray-400">No messages yet</div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isMine
                        ? "bg-pink-400 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {formatMessageTime(msg)}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-3 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 rounded-full border px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded-full bg-pink-400 text-white text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

