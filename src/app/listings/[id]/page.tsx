"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToMasters({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/masters/${params.id}`);
  }, [params.id, router]);
  return null;
}

