export function MovieCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
      {/* Poster Skeleton */}
      <div className="aspect-[2/3] bg-gray-700" />
      
      {/* Content Skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-5 bg-gray-700 rounded mb-2" />
        
        {/* Genre */}
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded" />
          <div className="h-3 bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}