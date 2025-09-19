import React from 'react';
import ClientListing from '@/app/masters/[id]/ClientListing';

export default function ListingOpenPage({ params }: { params: { id: string } }) {
  return <ClientListing id={params.id} />;
}
