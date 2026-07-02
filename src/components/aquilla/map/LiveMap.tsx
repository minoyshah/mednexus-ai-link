import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Navigation, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { StylizedCanvas } from "./StylizedCanvas";
import { MOCK_CENTER, MOCK_DESTINATION, MOCK_ROUTE, MOCK_YOU } from "./mockGeo";
import type { LngLat, MapPin } from "./types";
import type { AquillaMapProps } from "./AquillaMap";

/** Lazy: maplibre-gl + its CSS stay out of the main bundle entirely. */
const AquillaMap = lazy(() => import("./AquillaMap"));

/** Cheap, dependency-free WebGL probe (avoids importing maplibre in main). */
function webglAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

interface LiveMapProps {
  /** Tracking mode: draw the route + destination (StreetMap compatibility). */
  nav?: boolean;
  arrived?: boolean;
  /** Pan/zoom + pin taps. Off for decorative backdrops (the default). */
  interactive?: boolean;
  you?: LngLat;
  destination?: LngLat;
  route?: LngLat[];
  proAt?: LngLat;
  pins?: MapPin[];
  focusedId?: string | null;
  onFocusPin?: (id: string | null) => void;
  /** Try the browser's geolocation and surface permission states. */
  requestLocation?: boolean;
  className?: string;
}

type GeoState = "off" | "prompting" | "granted" | "denied" | "unavailable";

/** Minimal geolocation with explicit, handled states. */
function useGeolocation(enabled: boolean) {
  const [state, setState] = useState<GeoState>("off");
  const [coords, setCoords] = useState<LngLat | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unavailable");
      return;
    }
    setState("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setState("granted");
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [enabled]);

  return { state, coords };
}

/** Render-time error boundary: any failure inside the live map → fallback. */
class MapErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The drop-in map surface. Shows the StylizedCanvas immediately (fast first
 * paint) and upgrades to the live MapLibre map when WebGL is available and
 * tiles load; otherwise it simply stays on the canvas. Same props shape as the
 * old StreetMap (`nav`, `arrived`) plus the richer pin/focus API.
 */
export function LiveMap({
  nav,
  arrived,
  interactive = false,
  you = MOCK_YOU,
  destination,
  route,
  proAt,
  pins = [],
  focusedId,
  onFocusPin,
  requestLocation = false,
  className,
}: LiveMapProps) {
  const [failed, setFailed] = useState(false);
  const { state: geo, coords } = useGeolocation(requestLocation);

  const effectiveYou = coords ?? you;
  const effectiveRoute = route ?? (nav ? MOCK_ROUTE : undefined);
  const effectiveDest = destination ?? (nav ? MOCK_DESTINATION : undefined);
  const canUseGl = webglAvailable() && !failed;

  const fallback = (
    <StylizedCanvas
      route={effectiveRoute}
      you={effectiveYou}
      destination={effectiveDest}
      pins={pins}
      arrived={arrived}
      animateRoute={nav}
      className="h-full w-full"
    />
  );

  const mapProps: AquillaMapProps = {
    center: nav ? effectiveYou : MOCK_CENTER,
    zoom: interactive ? 13.4 : 13.8,
    interactive,
    you: effectiveYou,
    destination: effectiveDest,
    proAt,
    arrived,
    route: effectiveRoute,
    pins,
    focusedId,
    onFocusPin,
    onError: () => setFailed(true),
    className: "h-full w-full",
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-map-land", className)}>
      {canUseGl ? (
        <MapErrorBoundary fallback={fallback}>
          {/* Suspense fallback IS the stylized canvas → instant first paint. */}
          <Suspense fallback={fallback}>
            <AquillaMap {...mapProps} />
          </Suspense>
        </MapErrorBoundary>
      ) : (
        fallback
      )}

      {/* Geolocation permission states — only when location was requested. */}
      {requestLocation && (geo === "denied" || geo === "unavailable") && (
        <div className="absolute inset-x-3 top-3 z-20 flex items-center gap-2 rounded-md bg-card/95 px-3 py-2 shadow-card backdrop-blur">
          <MapPinOff size={16} className="shrink-0 text-muted-foreground" />
          <span className="text-[12.5px] font-semibold text-foreground">
            {geo === "denied" ? "Location off — showing your saved area" : "Location unavailable"}
          </span>
        </div>
      )}
      {requestLocation && geo === "prompting" && (
        <div className="absolute inset-x-3 top-3 z-20 flex items-center gap-2 rounded-md bg-card/95 px-3 py-2 shadow-card backdrop-blur">
          <Navigation size={16} className="shrink-0 animate-pulse text-primary" />
          <span className="text-[12.5px] font-semibold text-foreground">Finding your location…</span>
        </div>
      )}
    </div>
  );
}
