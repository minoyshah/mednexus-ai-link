import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholders shaped like the real content (rows, cards, the
 * earnings header) so layout never jumps when data lands.
 */

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex min-h-14 items-center gap-3 px-4 py-3", className)}>
      <Skeleton className="h-11 w-11 rounded-sm" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("rounded-lg border border-border bg-card p-4 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-[52px] w-[52px] rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <Skeleton className="mt-4 h-11 w-full rounded-md" />
    </div>
  );
}

/** A list of skeleton rows with a polite busy announcement. */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" aria-busy className={className}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
