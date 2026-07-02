import { cn } from "@/lib/utils";
import { STATUS_META, toJobStatus, type JobStatus } from "./status";

interface StatusPillProps {
  /** Canonical job_status or a prototype label ("Awaiting part"). */
  status: JobStatus | string;
  /** solid = on map/sheet headers; tint = inside cards and rows. */
  appearance?: "solid" | "tint";
  /** Pulse the dot while actively searching/moving. */
  live?: boolean;
  /**
   * Context-specific label override (same status color). E.g. the customer
   * sees "Finding your pro" while the pro's request card reads "New request".
   */
  label?: string;
  className?: string;
}

/**
 * The status chip used everywhere a job state appears. One source of color
 * (status.ts) so a pill, a map pin and a list row can never disagree.
 */
export function StatusPill({ status, appearance = "solid", live, label, className }: StatusPillProps) {
  const s = toJobStatus(String(status));
  const meta = STATUS_META[s];
  const isLive = live ?? (s === "requested" || s === "en_route");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        appearance === "solid"
          ? cn(meta.bg, "text-white")
          : cn(meta.tint, meta.text),
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          appearance === "solid" ? "bg-white/90" : meta.bg,
          isLive && "motion-safe:animate-pulse",
        )}
      />
      {label ?? meta.label}
    </span>
  );
}
