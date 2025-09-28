'use client';

import React, { useEffect, useRef, useState } from "react";
import { startChat, myChats, loadMessages, sendMessage } from "@/components/chat/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { useMemo } from 'react';

export default function ChatPageClient() {
  const { user } = useAuth(); // {uid, role}
  const params = useSearchParams();
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // ensure stable instance for children if needed
  const stableParams = useMemo(() => params, [params]);

  useEffect(() => {
    if (!user) return;
    myChats(user.uid).then(setChats).catch(console.error);
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !stableParams) return;
    const b = stableParams.get("booking");
    if (b) {
      startChat(b, user.uid).then((id)=> {
        setChatId(id);
        refreshMessages(id);
      }).catch(console.error);
    }
  }, [user?.uid, stableParams]);

  async function refreshMessages(id: string) {
    const msgs = await loadMessages(id);
    setMessages(msgs);
    setTimeout(()=>scrollRef.current?.scrollIntoView({block:"end"}), 0);
    // отметим как прочитано
    if (user?.uid) {
      fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ chatId: id, userId: user.uid })
      }).catch(()=>{});
      try { window.dispatchEvent(new CustomEvent("notify:refresh")); } catch {}
    }
  }

  async function onSend() {
    if (!chatId || !user || !text.trim()) return;
    await sendMessage(chatId, user.uid, text.trim());
    setText("");
    await refreshMessages(chatId);
    // Обновим счётчик сразу
    try { window.dispatchEvent(new CustomEvent("notify:refresh")); } catch {}
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 p-6">
      <div className="border rounded-xl bg-white shadow-sm p-3">
        <div className="font-semibold mb-2">My chats</div>
        <ul className="space-y-2">
          {chats.map(c=>(
            <li key={c.id}>
              <button
                className={`w-full text-left underline hover:text-pink-600 ${chatId===c.id?"font-semibold text-pink-600":""}`}
                onClick={()=>{ setChatId(c.id); refreshMessages(c.id); }}
              >
                {c.lastMessage ? c.lastMessage.slice(0,40) : "New chat"} • {c.updatedAt?._seconds ? new Date(c.updatedAt._seconds*1000).toLocaleString() : ""}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2 border rounded-xl bg-white shadow-sm p-3 flex flex-col">
        <div className="font-semibold mb-2">Chat</div>
        <div className="flex-1 overflow-auto border rounded-lg p-3 space-y-3 bg-gray-50">
          {messages.map(m=>(
            <div key={m.id} className={`flex gap-2 ${m.senderId===user?.uid?"justify-end":"justify-start"}`}>
              <div className={`max-w-[80%] inline-block px-3 py-2 rounded-2xl shadow-sm ${m.senderId===user?.uid?"bg-pink-100":"bg-white border"}`}>
                <div className="text-sm whitespace-pre-wrap break-words leading-6">{m.text}</div>
                <div className="text-[11px] opacity-60 mt-1 text-right">{m.createdAt?._seconds ? new Date(m.createdAt._seconds*1000).toLocaleString() : ""}</div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            className="input input-bordered w-full rounded-lg"
            placeholder="Type a message..."
            onKeyDown={(e)=>{ if (e.key==="Enter") onSend(); }}
          />
          <button className="btn btn-primary rounded-lg" onClick={onSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
