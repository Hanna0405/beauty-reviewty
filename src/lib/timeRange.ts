export type TimeRange = { start: string; end: string }; // HH:mm
export type DayBlock = { date: string; start: string; end: string }; // date=YYYY-MM-DD

export function parseHM(s: string): {h:number;m:number} {
 const [hh, mm] = s.split(":").map(Number);
 return { h: hh, m: mm };
}
export function toMinutes(h:number,m:number){ return h*60+m; }

export function overlap(a:{start:string,end:string}, b:{start:string,end:string}) {
 const A1 = toMinutes(...Object.values(parseHM(a.start)) as [number,number]);
 const A2 = toMinutes(...Object.values(parseHM(a.end)) as [number,number]);
 const B1 = toMinutes(...Object.values(parseHM(b.start)) as [number,number]);
 const B2 = toMinutes(...Object.values(parseHM(b.end)) as [number,number]);
 return Math.max(A1,B1) < Math.min(A2,B2);
}

// "13:10" + 60 => "14:10"
export function addMinutes(hm: string, delta: number) {
 const {h,m} = parseHM(hm);
 const total = h*60 + m + delta;
 const nh = Math.floor((total % (24*60) + (24*60)) % (24*60) / 60);
 const nm = ((total % 60) + 60) % 60;
 const z = (n:number)=> String(n).padStart(2,"0");
 return `${z(nh)}:${z(nm)}`;
}
