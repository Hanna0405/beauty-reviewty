"use client";
import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

// Next.js 15: params is now a Promise, use React.use() to unwrap it in client components
export default function RedirectToMasters({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  useEffect(() => {
    router.replace(`/masters/${id}`);
  }, [id, router]);
  return null;
}
