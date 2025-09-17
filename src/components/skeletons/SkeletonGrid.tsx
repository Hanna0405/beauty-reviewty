import SkeletonCard from './SkeletonCard';

export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="container mx-auto px-4">
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4 md:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
