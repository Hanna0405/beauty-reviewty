import MasterProfileClient from '@/components/MasterProfileClient';

export const runtime = 'nodejs'; // ensure not edge
// Next.js 15: params is now a Promise and must be awaited
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  return <MasterProfileClient id={decodedId} />;
}
