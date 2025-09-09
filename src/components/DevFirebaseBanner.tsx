/// src/components/DevFirebaseBanner.tsx
"use client";
import { isFirebaseReady } from "@/lib/firebase";

export default function DevFirebaseBanner() {
 if (process.env.NODE_ENV === "production" || isFirebaseReady) return null;
 return (
 <div style={{background:"#FFF3CD",color:"#664D03",padding:"8px 12px",border:"1px solid #FFECB5",borderRadius:6,margin:"8px 0"}}>
 Authentication is not configured. Fill <code>.env.local</code> and restart dev.
 </div>
 );
}
