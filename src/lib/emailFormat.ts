export function formatWhenFromBooking(b: any) {
  // Handle Firestore Timestamp
  if (b.startAt?.toDate) {
    const d = b.startAt.toDate();
    return d.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  // Handle Timestamp with _seconds
  if (b.startAt?._seconds) {
    const d = new Date(b.startAt._seconds * 1000);
    return d.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  // Handle ISO string
  if (typeof b.startAt === "string") {
    const d = new Date(b.startAt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  // Handle startMs (milliseconds timestamp)
  if (typeof b.startMs === "number") {
    const d = new Date(b.startMs);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  return "";
}
export function listingPublicUrl(b:any) {
 const slug = b._listing?.slug || b.listingId;
 // подставь свой домен, при dev можно localhost
 const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
 return `${host}/listing/${slug}`;
}
export function chatUrl(chatId:string) {
 const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
 return `${host}/dashboard/chat?chat=${chatId}`;
}
