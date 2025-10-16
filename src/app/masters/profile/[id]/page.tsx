import { redirect } from 'next/navigation';

type Props = { params: { id: string } };

export default function LegacyMasterProfileRedirect({ params }: Props) {
  redirect(`/profile/${params.id}`);
}

