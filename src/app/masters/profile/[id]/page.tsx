import { redirect } from "next/navigation";

// Next.js 15: params is now a Promise and must be awaited
type Props = { params: Promise<{ id: string }> };

export default async function LegacyMasterProfileRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/profile/${id}`);
}
