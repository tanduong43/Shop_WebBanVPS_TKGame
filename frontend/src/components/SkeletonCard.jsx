// src/components/SkeletonCard.jsx - Loading skeleton cho product card
const SkeletonCard = () => (
  <div className="glass-card p-5 animate-pulse">
    {/* Image placeholder */}
    <div className="skeleton h-40 w-full rounded-xl mb-4" />
    {/* Badge */}
    <div className="skeleton h-5 w-24 rounded-full mb-3" />
    {/* Title */}
    <div className="skeleton h-5 w-full rounded mb-2" />
    <div className="skeleton h-5 w-3/4 rounded mb-4" />
    {/* Description */}
    <div className="skeleton h-4 w-full rounded mb-1" />
    <div className="skeleton h-4 w-5/6 rounded mb-4" />
    {/* Specs row */}
    <div className="flex gap-2 mb-4">
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
    {/* Price + button */}
    <div className="flex items-center justify-between">
      <div className="skeleton h-7 w-28 rounded" />
      <div className="skeleton h-10 w-28 rounded-xl" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;
