export async function startChat(bookingId: string, userId: string) {
  const r = await fetch("/api/chat/start", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ bookingId, userId }) });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed to start chat");
  return d.chatId as string;
}

export async function myChats(userId: string) {
  const r = await fetch("/api/chat/my", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ userId }) });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed to load chats");
  return d.items as any[];
}

export async function loadMessages(chatId: string) {
  const r = await fetch("/api/chat/messages", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chatId }) });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed to load messages");
  return d.items as any[];
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const r = await fetch("/api/chat/send", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chatId, senderId, text }) });
  const d = await r.json();
  if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed to send");
  // Обновим счётчик сразу после отправки сообщения
  try { window.dispatchEvent(new CustomEvent("notify:refresh")); } catch {}
  return true;
}
