// Lightweight pulsing card placeholder shown while real product data is
// in flight. Matches the dimensions of ProductCard so the layout doesn't
// shift when the real cards swap in.
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 space-y-2">
        <div className="h-2 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-7 bg-gray-200 rounded mt-1" />
      </div>
    </div>
  );
}

export function ProductRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
