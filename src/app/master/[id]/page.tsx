import MasterProfileClient from '@/components/MasterProfileClient';

export const runtime = 'nodejs'; // ensure not edge
export default function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return <MasterProfileClient id={id} />;
}
