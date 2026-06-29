// Skeleton — presentational loading placeholders. A plain pulse bar plus a
// card-shaped variant for list loading states. Uses Tailwind's animate-pulse,
// which the global prefers-reduced-motion CSS already disables for users who
// opt out of motion.

interface SkeletonProps {
  className?: string
}

/** A single pulsing placeholder bar. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  )
}

/** A card-shaped skeleton matching the FountainCard footprint. */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
    >
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
