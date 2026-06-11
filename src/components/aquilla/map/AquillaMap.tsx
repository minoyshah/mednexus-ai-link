import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./aq-map.css";
import type { FeatureCollection, Point } from "geojson";
import { STATUS_META, type JobStatus } from "../status";
import type { LngLat, MapPin } from "./types";

/**
 * Live MapLibre map. Loaded lazily (default export) so maplibre-gl + its CSS
 * never touch the main bundle. Token-styled to the Aquilla palette; renders a
 * clustered, status-colored pin layer, a gradient route line, and DOM markers
 * for "you" / the destination / a moving pro. All map calls are guarded; on
 * style/WebGL failure it calls onError so the caller can fall back.
 *
 * Basemap style: VITE_MAP_STYLE if provided (drop in OpenFreeMap/MapTiler/
 * Mapbox with no code change), else the keyless MapLibre demo style.
 */

const STYLE_URL =
  (import.meta.env.VITE_MAP_STYLE as string | undefined) ??
  "https://demotiles.maplibre.org/style.json";

export interface AquillaMapProps {
  center: LngLat;
  zoom?: number;
  interactive?: boolean;
  you?: LngLat;
  destination?: LngLat;
  proAt?: LngLat;
  arrived?: boolean;
  route?: LngLat[];
  pins?: MapPin[];
  focusedId?: string | null;
  onFocusPin?: (id: string | null) => void;
  onReady?: () => void;
  onError?: () => void;
  className?: string;
}

/** Resolve a `--status-*` token to a concrete `hsl(...)` MapLibre can paint. */
function resolveStatus(status: JobStatus): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(STATUS_META[status].cssVar)
    .trim();
  return raw ? `hsl(${raw})` : "#2E5BFF";
}
function readVar(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw})` : fallback;
}

function pinsToGeoJSON(pins: MapPin[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pins.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: p.at },
      properties: { id: p.id, color: resolveStatus(p.status) },
    })),
  };
}

/** Build a DOM marker element for the "you" / pro / destination markers. */
function makeMarkerEl(kind: "you" | "pro" | "destination", arrived?: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = "aq-marker";
  el.style.willChange = "transform";
  if (kind === "you") {
    el.innerHTML = `<span class="aq-you-halo"></span><span class="aq-you-dot"></span>`;
  } else if (kind === "destination") {
    el.innerHTML = arrived
      ? `<span class="aq-dest aq-arrived">✓</span>`
      : `<span class="aq-dest"></span>`;
  } else {
    el.innerHTML = `<span class="aq-pro"></span>`;
  }
  return el;
}

export default function AquillaMap({
  center,
  zoom = 13.2,
  interactive = true,
  you,
  destination,
  proAt,
  arrived,
  route,
  pins = [],
  focusedId,
  onFocusPin,
  onReady,
  onError,
  className,
}: AquillaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const markers = useRef<{ you?: maplibregl.Marker; pro?: maplibregl.Marker; dest?: maplibregl.Marker }>({});

  // ---- create the map once -------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center,
        zoom,
        interactive,
        attributionControl: false,
        // keep first paint cheap; we animate explicitly
        fadeDuration: 120,
      });
    } catch {
      onError?.();
      return;
    }
    mapRef.current = map;

    const failTimer = window.setTimeout(() => {
      if (!readyRef.current) onError?.();
    }, 9000);

    map.on("error", () => {
      if (!readyRef.current) onError?.();
    });

    map.on("load", () => {
      readyRef.current = true;
      window.clearTimeout(failTimer);
      try {
        // Dim the basemap toward our canvas token so pins/route pop.
        const land = readVar("--map-land", "#EAEDF1");
        if (map.getLayer("background")) {
          map.setPaintProperty("background", "background-color", land);
        }
        // route
        if (route && route.length > 1) {
          map.addSource("aq-route", {
            type: "geojson",
            lineMetrics: true,
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } },
          });
          map.addLayer({
            id: "aq-route-casing",
            type: "line",
            source: "aq-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#ffffff", "line-width": 9 },
          });
          map.addLayer({
            id: "aq-route-line",
            type: "line",
            source: "aq-route",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-width": 5.5,
              "line-gradient": [
                "interpolate", ["linear"], ["line-progress"],
                0, resolveStatus("requested"),
                1, resolveStatus("accepted"),
              ],
            },
          });
        }
        // clustered pins
        map.addSource("aq-pins", {
          type: "geojson",
          data: pinsToGeoJSON(pins),
          cluster: true,
          clusterRadius: 48,
          clusterMaxZoom: 15,
        });
        const brand = readVar("--primary", "#2E5BFF");
        map.addLayer({
          id: "aq-clusters",
          type: "circle",
          source: "aq-pins",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": brand,
            "circle-opacity": 0.92,
            "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: "aq-cluster-count",
          type: "symbol",
          source: "aq-pins",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "aq-point",
          type: "circle",
          source: "aq-pins",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 9,
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });

        // interactions
        map.on("click", "aq-clusters", (e) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ["aq-clusters"] })[0];
          const clusterId = f?.properties?.cluster_id;
          const src = map.getSource("aq-pins") as maplibregl.GeoJSONSource | undefined;
          if (clusterId == null || !src) return;
          src.getClusterExpansionZoom(clusterId).then((z) => {
            map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: z });
          }).catch(() => {});
        });
        map.on("click", "aq-point", (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined;
          if (id) onFocusPin?.(id);
        });
        const hover = (cursor: string) => () => { map.getCanvas().style.cursor = cursor; };
        ["aq-clusters", "aq-point"].forEach((l) => {
          map.on("mouseenter", l, hover("pointer"));
          map.on("mouseleave", l, hover(""));
        });

        // DOM markers
        if (you) {
          markers.current.you = new maplibregl.Marker({ element: makeMarkerEl("you") })
            .setLngLat(you).addTo(map);
        }
        if (destination) {
          markers.current.dest = new maplibregl.Marker({ element: makeMarkerEl("destination", arrived) })
            .setLngLat(destination).addTo(map);
        }
        if (proAt) {
          markers.current.pro = new maplibregl.Marker({ element: makeMarkerEl("pro") })
            .setLngLat(proAt).addTo(map);
        }
        onReady?.();
      } catch {
        onError?.();
      }
    });

    return () => {
      window.clearTimeout(failTimer);
      Object.values(markers.current).forEach((m) => m?.remove());
      markers.current = {};
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // create once; subsequent prop changes handled by the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- update pins ---------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource("aq-pins") as maplibregl.GeoJSONSource | undefined;
    src?.setData(pinsToGeoJSON(pins));
  }, [pins]);

  // ---- move the pro marker (dispatch tracking) -----------------------------
  useEffect(() => {
    if (proAt) markers.current.pro?.setLngLat(proAt);
  }, [proAt]);

  // ---- arrived flips the destination marker --------------------------------
  useEffect(() => {
    const m = markers.current.dest;
    if (!m) return; // keep MapLibre's own element; just swap its contents
    m.getElement().innerHTML = arrived
      ? `<span class="aq-dest aq-arrived">✓</span>`
      : `<span class="aq-dest"></span>`;
  }, [arrived]);

  // ---- focus a pin ---------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !focusedId) return;
    const pin = pins.find((p) => p.id === focusedId);
    if (pin) map.flyTo({ center: pin.at, zoom: Math.max(map.getZoom(), 15), speed: 0.8 });
  }, [focusedId, pins]);

  return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
