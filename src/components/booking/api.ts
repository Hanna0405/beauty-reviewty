export async function fetchBookings(scope: "master"|"client", userId: string) {
 const res = await fetch("/api/booking/list", {
 method: "POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ scope, userId })
 });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load bookings");
 return data.items as any[];
}

export async function updateBooking(bookingId: string, action: "confirm"|"decline"|"delete", userId: string) {
 const res = await fetch("/api/booking/update", {
 method: "POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ bookingId, action, userId })
 });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to update booking");
 // Обновим счётчик сразу после изменения статуса
 try { window.dispatchEvent(new CustomEvent("notify:refresh")); } catch {}
 return true;
}

export async function getAvailability(masterId: string) {
 const res = await fetch("/api/availability/get", {
 method: "POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify({ masterId })
 });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load availability");
 return data.schedule as any;
}

export async function setAvailability(payload: {masterId:string, weekly?:any, daysOff?:string[], blocks?:any[]}) {
 const res = await fetch("/api/availability/set", {
 method: "POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(payload)
 });
 const data = await res.json();
 if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to save availability");
 return true;
}
