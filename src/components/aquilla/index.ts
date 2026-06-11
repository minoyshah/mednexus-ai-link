/**
 * Aquilla primitives — the product-specific layer above components/ui.
 * Everything here consumes the token system in index.css; nothing hardcodes
 * a color. Import from "@/components/aquilla".
 */
export { StatusPill } from "./StatusPill";
export { Money } from "./Money";
export { ListRow, RowIcon } from "./ListRow";
export { BottomSheet } from "./BottomSheet";
export { EmptyState } from "./EmptyState";
export { SkeletonRow, SkeletonCard, SkeletonList } from "./Skeletons";
export { STATUS_META, toJobStatus, statusColor, type JobStatus } from "./status";

/* Map system (Phase 2). LiveMap is the drop-in surface; MapExperience is the
   interactive map + sheet. maplibre-gl is lazy-loaded inside AquillaMap. */
export { LiveMap } from "./map/LiveMap";
export { MapExperience } from "./map/MapExperience";
export { StylizedCanvas } from "./map/StylizedCanvas";
export type { LngLat, MapPin, MapViewport } from "./map/types";
export {
  MOCK_CENTER, MOCK_YOU, MOCK_DESTINATION, MOCK_ROUTE, MOCK_NEARBY, pointOnRoute, offsetByMiles,
} from "./map/mockGeo";
