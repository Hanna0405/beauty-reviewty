/// src/hooks/useFirebaseReady.ts
"use client";
import { useEffect, useState } from "react";
import { firebaseStatus } from "@/lib/firebase";

export default function useFirebaseReady() {
 const [{ ready, missing }, setState] = useState(firebaseStatus());
 useEffect(() => { setState(firebaseStatus()); }, []);
 return { ready, missing };
}
