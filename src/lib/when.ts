export function whenText(b:any) {
 const d = b.startAt?.toDate ? b.startAt.toDate() : (b.startAt?._seconds ? new Date(b.startAt._seconds*1000) : null);
 if (!d) return "-";
 return d.toLocaleString(undefined, { year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}
