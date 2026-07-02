/**
 * Job lifecycle — the one place status names, labels, and colors meet.
 * Mirrors public.job_status in the backend schema; the prototype's display
 * strings ("Completed", "Awaiting part", …) normalize into the same set so
 * the UI is already shaped for live data.
 */

export type JobStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "arrived"
  | "awaiting_part"
  | "completed"
  | "visit_fee"
  | "disputed"
  | "cancelled";

/** Prototype display strings → canonical status. */
const LEGACY: Record<string, JobStatus> = {
  requested: "requested",
  searching: "requested",
  accepted: "accepted",
  matched: "accepted",
  confirmed: "accepted",
  "en route": "en_route",
  en_route: "en_route",
  "on the way": "en_route",
  arrived: "arrived",
  arriving: "arrived",
  "awaiting part": "awaiting_part",
  awaiting_part: "awaiting_part",
  completed: "completed",
  "visit fee": "visit_fee",
  visit_fee: "visit_fee",
  disputed: "disputed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

/** Normalize any status-ish string (DB enum or prototype label). */
export function toJobStatus(value: string): JobStatus {
  return LEGACY[value.trim().toLowerCase()] ?? "requested";
}

interface StatusMeta {
  /** Short human label, sentence case. */
  label: string;
  /** Tailwind background class (solid fill). */
  bg: string;
  /** Tailwind text class for the status color itself. */
  text: string;
  /** Soft tint background for rows/cards. */
  tint: string;
  /** CSS variable stem, for non-Tailwind consumers (SVG pins, charts). */
  cssVar: string;
  /** Whether money is in flight / at risk in this state. */
  fundsHeld: boolean;
}

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  requested: {
    label: "Finding your pro",
    bg: "bg-status-requested",
    text: "text-status-requested",
    tint: "bg-status-requested/10",
    cssVar: "--status-requested",
    fundsHeld: false,
  },
  accepted: {
    label: "Matched",
    bg: "bg-status-accepted",
    text: "text-status-accepted",
    tint: "bg-status-accepted/10",
    cssVar: "--status-accepted",
    fundsHeld: true,
  },
  en_route: {
    label: "En route",
    bg: "bg-status-en-route",
    text: "text-status-en-route",
    tint: "bg-status-en-route/10",
    cssVar: "--status-en-route",
    fundsHeld: true,
  },
  arrived: {
    label: "Arrived",
    bg: "bg-status-arrived",
    text: "text-status-arrived",
    tint: "bg-status-arrived/10",
    cssVar: "--status-arrived",
    fundsHeld: true,
  },
  awaiting_part: {
    label: "Awaiting part",
    bg: "bg-status-awaiting-part",
    text: "text-status-awaiting-part",
    tint: "bg-status-awaiting-part/10",
    cssVar: "--status-awaiting-part",
    fundsHeld: true,
  },
  completed: {
    label: "Completed",
    bg: "bg-status-completed",
    text: "text-status-completed",
    tint: "bg-status-completed/10",
    cssVar: "--status-completed",
    fundsHeld: false,
  },
  visit_fee: {
    label: "Visit fee",
    bg: "bg-status-visit-fee",
    text: "text-status-visit-fee",
    tint: "bg-status-visit-fee/10",
    cssVar: "--status-visit-fee",
    fundsHeld: false,
  },
  disputed: {
    label: "Disputed — funds held",
    bg: "bg-status-disputed",
    text: "text-status-disputed",
    tint: "bg-status-disputed/10",
    cssVar: "--status-disputed",
    fundsHeld: true,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-status-cancelled",
    text: "text-status-cancelled",
    tint: "bg-status-cancelled/10",
    cssVar: "--status-cancelled",
    fundsHeld: false,
  },
};

/** hsl(var(--…)) color string for SVG/canvas consumers (map pins, charts). */
export function statusColor(status: JobStatus): string {
  return `hsl(var(${STATUS_META[status].cssVar}))`;
}
