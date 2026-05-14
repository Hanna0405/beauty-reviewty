import type { Metadata } from "next";
import React from "react";
import ClientListing from "@/app/masters/[id]/ClientListing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    alternates: {
      canonical: `/masters/${id}`,
    },
  };
}

// Next.js 15: params is now a Promise and must be awaited
export default async function ListingOpenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientListing id={id} />;
}
