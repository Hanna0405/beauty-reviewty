export function formatWhenFromBooking(b:any) {
 const d = b.startAt?.toDate ? b.startAt.toDate() : (b.startAt?._seconds ? new Date(b.startAt._seconds*1000) : null);
 if (!d) return "";
 // локально ISO → "YYYY-MM-DD HH:mm"
 return d.toISOString().slice(0,16).replace("T"," ");
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
