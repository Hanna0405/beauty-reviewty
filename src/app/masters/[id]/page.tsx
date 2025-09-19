import React from 'react';
import ClientListing from './ClientListing';

export default function MastersListingPage({ params }: { params: { id: string } }) {
  return <ClientListing id={params.id} />;
}