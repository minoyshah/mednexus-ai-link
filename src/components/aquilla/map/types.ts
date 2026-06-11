import type { JobStatus } from "../status";

/** [longitude, latitude] — MapLibre's coordinate order. */
export type LngLat = [number, number];

/** A status-colored point on the map (a pro, an open job, the destination). */
export interface MapPin {
  id: string;
  at: LngLat;
  status: JobStatus;
  /** Short title for the focused card (e.g. pro name or job problem). */
  title?: string;
  subtitle?: string;
  /** Optional money figure shown on the focused card. */
  price?: number;
  /** Render as the destination/home marker instead of a teardrop pin. */
  kind?: "pin" | "destination" | "pro";
}

export interface MapViewport {
  center: LngLat;
  zoom: number;
}
