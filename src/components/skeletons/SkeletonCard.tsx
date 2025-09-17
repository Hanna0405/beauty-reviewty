export default function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
      <div className="relative w-full aspect-[4/5] bg-rose-100/70 skeleton-shimmer" />
      <div className="p-3 md:p-4 space-y-2">
        <div className="h-4 rounded-md bg-rose-100/80 skeleton-shimmer w-3/4" />
        <div className="h-3 rounded-md bg-rose-100/70 skeleton-shimmer w-2/3" />
        <div className="h-3 rounded-md bg-rose-100/60 skeleton-shimmer w-1/2" />
      </div>
    </div>
  );
}
