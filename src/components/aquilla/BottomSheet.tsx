import * as React from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: React.ReactNode;
  /**
   * Snap heights as fractions of the container (sorted low→high),
   * e.g. [0.22, 0.48, 0.88] = peek / half / tall.
   */
  snapPoints?: number[];
  /** Controlled snap index; uncontrolled starts at `defaultSnap`. */
  snap?: number;
  defaultSnap?: number;
  onSnapChange?: (index: number) => void;
  /** Sticky header rendered above the scrollable body (always visible). */
  header?: React.ReactNode;
  /** Accessible name for the sheet region. */
  label?: string;
  className?: string;
}

const DRAG_THRESHOLD_PX = 24;

/**
 * Map-style draggable bottom sheet: content above stays interactive (no
 * backdrop), the sheet snaps between peek/half/tall. Drag with touch or
 * mouse from anywhere in the header area; body scrolls only at full height.
 * Dependency-free (pointer events + CSS transforms) to keep the map at 60fps.
 */
export function BottomSheet({
  children,
  snapPoints = [0.22, 0.48, 0.88],
  snap,
  defaultSnap = 1,
  onSnapChange,
  header,
  label = "Details",
  className,
}: BottomSheetProps) {
  const points = React.useMemo(
    () => [...snapPoints].sort((a, b) => a - b),
    [snapPoints],
  );
  const [internalSnap, setInternalSnap] = React.useState(
    Math.min(defaultSnap, points.length - 1),
  );
  const index = snap ?? internalSnap;
  const setIndex = React.useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(points.length - 1, i));
      setInternalSnap(clamped);
      onSnapChange?.(clamped);
    },
    [points.length, onSnapChange],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState<number | null>(null);
  const dragStart = React.useRef<{ y: number; height: number } | null>(null);

  const containerHeight = () => containerRef.current?.parentElement?.clientHeight ?? window.innerHeight;
  const heightFor = (i: number) => points[i] * containerHeight();

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, height: heightFor(index) };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = dragStart.current.y - e.clientY; // up = positive
    setDragOffset(dragStart.current.height + dy);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = dragStart.current.y - e.clientY;
    const target = dragStart.current.height + dy;
    dragStart.current = null;
    setDragOffset(null);
    if (Math.abs(dy) < DRAG_THRESHOLD_PX) return; // tap, not a drag
    // settle on the nearest snap point in the drag direction
    let nearest = index;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p * containerHeight() - target);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setIndex(nearest);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex(index + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex(index - 1);
    }
  };

  const height = dragOffset ?? heightFor(index);
  const atTop = index === points.length - 1;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={label}
      className={cn(
        "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-xl bg-card shadow-sheet",
        dragOffset === null &&
          "motion-safe:transition-[height] motion-safe:duration-300 motion-safe:[transition-timing-function:var(--ease-spring)]",
        className,
      )}
      style={{ height: Math.max(72, height) }}
    >
      {/* Grab area: the handle + header drag the sheet; it is also a button
          that cycles snap states for keyboard / assistive tech. */}
      <div
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type="button"
          aria-label={atTop ? "Collapse sheet" : "Expand sheet"}
          onKeyDown={onKeyDown}
          onClick={() => setIndex(atTop ? 0 : index + 1)}
          className="mx-auto mt-2 mb-1 block rounded-full p-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden className="block h-1.5 w-10 rounded-full bg-border" />
        </button>
        {header && <div className="px-4 pb-3">{header}</div>}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),16px)]",
          atTop ? "overflow-y-auto" : "overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
