import { fetchThread } from '@/lib/reviews';
import { ThreadGallery } from '@/components/review/ThreadGallery';
import { ThreadBlock } from '@/components/review/ThreadBlock';

export default async function ReviewtyThreadPage({ params }: { params: { publicCardId: string } }) {
  const data = await fetchThread(params.publicCardId);
  if (!data) return <div className="p-6">Not found</div>;

  const { card, reviews, photos } = data;

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{card.title ?? card.masterName ?? 'Master'}</h1>
        {/* optional meta: city/service badges if present */}
      </header>

      {/* Photo gallery across ALL reviews of this card */}
      <ThreadGallery photos={photos} />

      {/* One block with all reviews (keep existing ReviewCard rendering) */}
      <ThreadBlock card={card} reviews={reviews} />
    </div>
  );
}
