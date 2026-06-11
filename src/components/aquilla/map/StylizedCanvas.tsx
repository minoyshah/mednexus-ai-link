import { useMemo } from "react";
import { statusColor } from "../status";
import type { LngLat, MapPin } from "./types";

interface StylizedCanvasProps {
  route?: LngLat[];
  you?: LngLat;
  destination?: LngLat;
  pins?: MapPin[];
  arrived?: boolean;
  /** Animate a marker travelling the route (dispatch tracking). */
  animateRoute?: boolean;
  className?: string;
}

const W = 400;
const H = 500;
const PAD = 60;

/**
 * The map's no-WebGL / offline fallback — and what renders wherever WebGL or
 * tiles are unavailable. A calm, token-colored street illustration that
 * projects the SAME real lng/lat as the live map, so pins, route and the
 * "you" marker land in the same relative places. Not a placeholder: it's a
 * first-class degraded experience.
 */
export function StylizedCanvas({
  route,
  you,
  destination,
  pins = [],
  arrived,
  animateRoute,
  className,
}: StylizedCanvasProps) {
  const all = useMemo<LngLat[]>(
    () => [
      ...(route ?? []),
      ...(you ? [you] : []),
      ...(destination ? [destination] : []),
      ...pins.map((p) => p.at),
    ],
    [route, you, destination, pins],
  );

  // Project lng/lat → SVG space (lat inverted), with padding. Falls back to a
  // centered default when there are no coordinates (decorative backdrops).
  const project = useMemo(() => {
    if (all.length === 0) return (_: LngLat): [number, number] => [W / 2, H / 2];
    const lngs = all.map((c) => c[0]);
    const lats = all.map((c) => c[1]);
    let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats);
    // guard against zero-extent (single point)
    if (maxLng - minLng < 1e-4) { minLng -= 0.004; maxLng += 0.004; }
    if (maxLat - minLat < 1e-4) { minLat -= 0.004; maxLat += 0.004; }
    return ([lng, lat]: LngLat): [number, number] => {
      const x = PAD + ((lng - minLng) / (maxLng - minLng)) * (W - 2 * PAD);
      const y = PAD + (1 - (lat - minLat) / (maxLat - minLat)) * (H - 2 * PAD);
      return [x, y];
    };
  }, [all]);

  const routePath = useMemo(() => {
    if (!route || route.length < 2) return null;
    return route
      .map((c, i) => `${i === 0 ? "M" : "L"}${project(c).join(" ")}`)
      .join(" ");
  }, [route, project]);

  const youXY = you ? project(you) : null;
  const destXY = destination ? project(destination) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden
    >
      <rect width={W} height={H} style={{ fill: "hsl(var(--map-land))" }} />
      {/* water + park accents */}
      <path d="M300 -20 L460 -20 L460 150 L360 60 Z" style={{ fill: "hsl(var(--map-water))" }} />
      <rect x="6" y="300" width="120" height="130" rx="14" style={{ fill: "hsl(var(--map-park))" }} />
      <rect x="296" y="360" width="130" height="140" rx="14" style={{ fill: "hsl(var(--map-park))" }} />

      {/* road casings then road fills — calm, recedes behind content */}
      <g style={{ stroke: "hsl(var(--map-casing))" }} strokeLinecap="round" fill="none">
        <path d="M-20 130 H460" strokeWidth="18" /><path d="M-20 250 H460" strokeWidth="11" />
        <path d="M-20 360 H460" strokeWidth="18" /><path d="M-20 440 H460" strokeWidth="11" />
        <path d="M80 -20 V520" strokeWidth="18" /><path d="M170 -20 V520" strokeWidth="10" />
        <path d="M250 -20 V520" strokeWidth="10" /><path d="M330 -20 V520" strokeWidth="18" />
      </g>
      <g style={{ stroke: "hsl(var(--map-road))" }} strokeLinecap="round" fill="none">
        <path d="M-20 130 H460" strokeWidth="13" /><path d="M-20 250 H460" strokeWidth="6" />
        <path d="M-20 360 H460" strokeWidth="13" /><path d="M-20 440 H460" strokeWidth="6" />
        <path d="M80 -20 V520" strokeWidth="13" /><path d="M170 -20 V520" strokeWidth="6" />
        <path d="M250 -20 V520" strokeWidth="6" /><path d="M330 -20 V520" strokeWidth="13" />
      </g>

      {/* route: white casing + cobalt→violet gradient */}
      {routePath && (
        <>
          <defs>
            <linearGradient id="aq-route" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="hsl(var(--status-requested))" />
              <stop offset="1" stopColor="hsl(var(--status-accepted))" />
            </linearGradient>
          </defs>
          <path d={routePath} fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d={routePath} fill="none" stroke="url(#aq-route)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          {animateRoute && !arrived && (
            <circle r="6" fill="#fff" style={{ filter: "drop-shadow(0 1px 3px rgba(14,23,38,.4))" }}>
              <animateMotion dur="5s" repeatCount="indefinite" path={routePath} rotate="auto" />
            </circle>
          )}
        </>
      )}

      {/* nearby pins, colored by status */}
      {pins.map((p) => {
        const [x, y] = project(p.at);
        const col = statusColor(p.status);
        return (
          <g key={p.id} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="13" rx="7" ry="2.5" fill="rgba(14,23,38,.16)" />
            <path
              d="M0 -16 c-8 0 -13 6 -13 13 c0 9 13 22 13 22 s13 -13 13 -22 c0 -7 -5 -13 -13 -13 z"
              style={{ fill: col }}
              stroke="#fff"
              strokeWidth="2.5"
            />
            <circle cy="-3" r="4.5" fill="#fff" />
          </g>
        );
      })}

      {/* destination / home */}
      {destXY && (
        <g transform={`translate(${destXY[0]} ${destXY[1]})`}>
          {arrived ? (
            <>
              <circle r="13" style={{ fill: "hsl(var(--status-arrived))" }} stroke="#fff" strokeWidth="3.5" />
              <path d="M-5 0 L-1.5 3.5 L5 -4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <path d="M0 -18 c-9 0 -15 7 -15 15 c0 11 15 26 15 26 s15 -15 15 -26 c0 -8 -6 -15 -15 -15 z" style={{ fill: "hsl(var(--status-en-route))" }} stroke="#fff" strokeWidth="3" />
              <circle cy="-4" r="5.5" fill="#fff" />
            </>
          )}
        </g>
      )}

      {/* "you" — cobalt with soft halo */}
      {youXY && (
        <g transform={`translate(${youXY[0]} ${youXY[1]})`}>
          <circle r="20" style={{ fill: "hsl(var(--status-requested))" }} opacity="0.16">
            <animate attributeName="r" values="12;26;12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.28;0;0.28" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle r="9" style={{ fill: "hsl(var(--status-requested))" }} stroke="#fff" strokeWidth="3.5" />
        </g>
      )}
    </svg>
  );
}
