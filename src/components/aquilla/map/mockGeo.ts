import type { LngLat, MapPin } from "./types";

/**
 * Mock geography so the map is fully populated without live data. Every value
 * is real lng/lat (downtown grid) so swapping in the backend's job.lat/lng
 * later is a straight substitution — no shape changes.
 */

/** Default map center — a dense downtown so the styled streets read well. */
export const MOCK_CENTER: LngLat = [-122.4194, 37.7749]; // San Francisco

/** The signed-in user's location ("you"). */
export const MOCK_YOU: LngLat = [-122.4205, 37.7709];

/** The job address / destination ("home"). */
export const MOCK_DESTINATION: LngLat = [-122.4126, 37.7806];

/** A plausible driving route from "you" to the destination. */
export const MOCK_ROUTE: LngLat[] = [
  [-122.4205, 37.7709],
  [-122.4204, 37.7732],
  [-122.4169, 37.7735],
  [-122.4167, 37.7768],
  [-122.4131, 37.7771],
  [-122.4126, 37.7806],
];

/** Point fraction `t` (0..1) along the mock route — drives the moving pro pin. */
export function pointOnRoute(t: number, route: LngLat[] = MOCK_ROUTE): LngLat {
  if (route.length < 2) return route[0] ?? MOCK_YOU;
  const clamped = Math.max(0, Math.min(1, t));
  const span = (route.length - 1) * clamped;
  const i = Math.min(Math.floor(span), route.length - 2);
  const f = span - i;
  const [aLng, aLat] = route[i];
  const [bLng, bLat] = route[i + 1];
  return [aLng + (bLng - aLng) * f, aLat + (bLat - aLat) * f];
}

/** A spread of nearby pros/open jobs for the clustered browse experience. */
export const MOCK_NEARBY: MapPin[] = [
  { id: "p1", at: [-122.4151, 37.7762], status: "requested", title: "Marcus R.", subtitle: "Plumbing · ★ 4.9", price: 95, kind: "pro" },
  { id: "p2", at: [-122.4232, 37.7728], status: "requested", title: "Tanya O.", subtitle: "Electrical · ★ 4.8", price: 110, kind: "pro" },
  { id: "p3", at: [-122.4118, 37.7724], status: "accepted", title: "Diego M.", subtitle: "HVAC · ★ 4.7", price: 120, kind: "pro" },
  { id: "p4", at: [-122.4258, 37.7771], status: "requested", title: "Priya S.", subtitle: "Locksmith · ★ 5.0", price: 75, kind: "pro" },
  { id: "p5", at: [-122.4173, 37.7698], status: "en_route", title: "Sam C.", subtitle: "Handyman · ★ 4.6", price: 45, kind: "pro" },
  { id: "p6", at: [-122.4099, 37.7759], status: "requested", title: "Lena B.", subtitle: "Cleaning · ★ 4.9", price: 35, kind: "pro" },
  { id: "p7", at: [-122.4216, 37.7791], status: "requested", title: "Omar H.", subtitle: "Roofing · ★ 4.7", price: 140, kind: "pro" },
];
