export default function MasterCardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm animate-pulse">
      {/* Photo Skeleton */}
      <div className="mb-3 overflow-hidden rounded-lg border bg-gray-200 relative">
        <div className="aspect-square w-full bg-gray-300" />
      </div>

      {/* Content Skeleton */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {/* Name Skeleton */}
          <div className="h-5 bg-gray-300 rounded mb-1 w-3/4" />
          {/* City Skeleton */}
          <div className="h-4 bg-gray-200 rounded mb-1 w-1/2" />
          {/* Service Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Rating Skeleton */}
        <div className="text-right">
          <div className="h-4 bg-gray-300 rounded mb-1 w-16" />
          <div className="h-3 bg-gray-200 rounded w-12" />
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="mt-4">
        <div className="h-8 bg-gray-300 rounded-md w-24" />
      </div>
    </div>
  );
}
