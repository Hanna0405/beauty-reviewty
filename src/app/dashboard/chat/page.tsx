import { Suspense } from 'react';
import ChatPageClient from './ChatPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading chat…</div>}>
      <ChatPageClient />
    </Suspense>
  );
}
