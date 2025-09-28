"use client";
import React, { useEffect, useState } from "react";
import { getAvailability, setAvailability } from "@/components/booking/api";
import { useAuth } from "@/contexts/AuthContext";

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function AvailabilityPage() {
 const { user, profile } = useAuth();
 const [weekly, setWeekly] = useState<any>({});
 const [daysOff, setDaysOff] = useState<string[]>([]);
 const [blocks, setBlocks] = useState<any[]>([]);
 const [msg, setMsg] = useState("");

 useEffect(() => {
 if (!user?.uid) return;
 getAvailability(user.uid).then(s => {
 setWeekly(s.weekly || {});
 setDaysOff(s.daysOff || []);
 setBlocks(s.blocks || []);
 });
 }, [user?.uid]);

 async function save() {
 if (!user?.uid) return;
 await setAvailability({ masterId: user.uid, weekly, daysOff, blocks });
 setMsg("Saved");
 setTimeout(()=>setMsg(""),1500);
 }

 if (!user) return <div>Please sign in</div>;
 if (profile?.role !== "master") return <div>Only for masters</div>;

 return (
 <div className="space-y-4 p-6">
 <h1 className="text-xl font-semibold">My Availability</h1>
 <div className="text-sm opacity-70">Add working hours per day, days off (YYYY-MM-DD) and temporary blocks.</div>

 <div className="space-y-2">
 {DAY_NAMES.map((n, idx) => {
 const key = String(idx);
 const rows = weekly[key] || [];
 return (
 <div key={key} className="border p-3 rounded">
 <div className="font-medium mb-2">{n}</div>
 {rows.map((r:any, i:number)=>(
 <div key={i} className="flex gap-2 mb-2">
 <input value={r.start} onChange={e=>{
 const v=[...rows]; v[i]={...v[i], start:e.target.value}; setWeekly({...weekly, [key]: v});
 }} className="input input-bordered w-28" placeholder="09:00"/>
 <input value={r.end} onChange={e=>{
 const v=[...rows]; v[i]={...v[i], end:e.target.value}; setWeekly({...weekly, [key]: v});
 }} className="input input-bordered w-28" placeholder="17:00"/>
 <button onClick={()=>{
 const v=[...rows]; v.splice(i,1); setWeekly({...weekly, [key]: v});
 }} className="btn">Remove</button>
 </div>
 ))}
 <button onClick={()=>{
 const v=[...rows, {start:"09:00", end:"17:00"}];
 setWeekly({...weekly, [key]: v});
 }} className="btn">+ Add range</button>
 </div>
 );
 })}
 </div>

 <div className="border p-3 rounded">
 <div className="font-medium mb-2">Days off (YYYY-MM-DD)</div>
 <textarea className="textarea textarea-bordered w-full" rows={3}
 value={daysOff.join("\n")}
 onChange={e=>setDaysOff(e.target.value.split(/\s+/).filter(Boolean))}/>
 </div>

 <div className="border p-3 rounded">
 <div className="font-medium mb-2">Blocks (date start end)</div>
 <textarea className="textarea textarea-bordered w-full" rows={3}
 placeholder={"2025-10-03 13:00 15:00"}
 value={blocks.map(b=>`${b.date} ${b.start} ${b.end}`).join("\n")}
 onChange={e=>{
 const list = e.target.value.split("\n").filter(Boolean).map(line=>{
 const [date,start,end] = line.trim().split(/\s+/);
 return {date,start,end};
 });
 setBlocks(list);
 }}/>
 </div>

 <button className="btn btn-primary" onClick={save}>Save</button>
 {msg && <span className="ml-3 text-green-600">{msg}</span>}
 </div>
 );
}
