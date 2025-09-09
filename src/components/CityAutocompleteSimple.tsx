"use client";
import React, { useMemo, useState } from "react";

const DEFAULT_CITIES = [
 "Banff, AB, Canada","Barrie, ON, Canada","Toronto, ON, Canada","Calgary, AB, Canada","Vancouver, BC, Canada",
 "Edmonton, AB, Canada","Ottawa, ON, Canada","Montreal, QC, Canada","Winnipeg, MB, Canada","Quebec City, QC, Canada"
];

export default function CityAutocomplete({
 value, onChange, placeholder="City, Region, Country", options
}:{
 value:string; onChange:(full:string)=>void; placeholder?:string; options?:string[];
}) {
 const [q,setQ]=useState(value||""); const [open,setOpen]=useState(false); const [idx,setIdx]=useState(-1);
 const LIST = options?.length? options: DEFAULT_CITIES;
 const sugg = useMemo(()=> q.trim()? LIST.filter(c=>c.toLowerCase().includes(q.toLowerCase())).slice(0,20):[],[q,LIST]);
 const pick=(c:string)=>{ onChange(c); setQ(c); setOpen(false); setIdx(-1); };
 return (
 <div className="relative">
 <input className="w-full border rounded p-2" value={q}
 onChange={(e)=>{setQ(e.target.value); setOpen(true); setIdx(-1);}}
 onBlur={()=>{ if(!open) onChange(q.trim()); }} placeholder={placeholder}
 onKeyDown={(e)=>{ if(!sugg.length) return;
 if(e.key==="ArrowDown"){e.preventDefault(); setIdx(i=>Math.min(i+1,sugg.length-1));}
 else if(e.key==="ArrowUp"){e.preventDefault(); setIdx(i=>Math.max(i-1,0));}
 else if(e.key==="Enter"){e.preventDefault(); pick(sugg[idx>=0?idx:0]);}
 }}
 />
 {open && sugg.length>0 && (
 <ul className="absolute z-10 w-full mt-1 bg-white border rounded shadow">
 {sugg.map((c,i)=>(
 <li key={c} onMouseDown={(e)=>{e.preventDefault(); pick(c);}}
 className={`px-3 py-2 cursor-pointer ${i===idx?"bg-gray-100":""}`}>{c}</li>
 ))}
 </ul>
 )}
 </div>
 );
}
