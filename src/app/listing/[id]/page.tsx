import React from "react";
import ClientListing from "@/app/masters/[id]/ClientListing";

// Next.js 15: params is now a Promise and must be awaited
export default async function ListingOpenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientListing id={id} />;
}
