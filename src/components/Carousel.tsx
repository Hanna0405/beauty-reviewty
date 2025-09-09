"use client";
import React, { useState } from "react";

export default function Carousel({ photos }:{ photos:string[] }) {
 const [i,setI]=useState(0);
 if(!photos?.length) return null;
 const prev=()=> setI(v=> (v-1+photos.length)%photos.length);
 const next=()=> setI(v=> (v+1)%photos.length);
 return (
 <div className="relative w-full">
 <img src={photos[i]} className="w-full rounded border" />
 {photos.length>1 && (
 <>
 <button type="button" onClick={prev}
 className="absolute top-1/2 -translate-y-1/2 left-2 bg-black/50 text-white rounded px-2">‹</button>
 <button type="button" onClick={next}
 className="absolute top-1/2 -translate-y-1/2 right-2 bg-black/50 text-white rounded px-2">›</button>
 <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
 {photos.map((_,k)=>(<span key={k} className={`w-2 h-2 rounded-full ${k===i?'bg-white':'bg-white/50'}`}/>))}
 </div>
 </>
 )}
 </div>
 );
}
