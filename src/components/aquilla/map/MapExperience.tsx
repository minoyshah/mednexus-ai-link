import { useState } from "react";
import { MapPin as MapPinIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "../BottomSheet";
import { ListRow, RowIcon } from "../ListRow";
import { StatusPill } from "../StatusPill";
import { Money } from "../Money";
import { EmptyState } from "../EmptyState";
import { LiveMap } from "./LiveMap";
import { MOCK_NEARBY, MOCK_YOU } from "./mockGeo";
import type { LngLat, MapPin } from "./types";

interface MapExperienceProps {
  /** Status-colored points to browse. Defaults to mock nearby pros. */
  pins?: MapPin[];
  you?: LngLat;
  /** Sheet header title; a live count is appended. */
  title?: string;
  /** Fired when the user commits to a focused pin (e.g. "Choose"). */
  onSelect?: (pin: MapPin) => void;
  className?: string;
}

/**
 * The full Uber-style surface: an interactive, clustered map above a
 * draggable bottom sheet. Tapping a pin focuses it (map flies, sheet expands,
 * its card leads the list); tapping a row focuses its pin. One status color
 * system shared by pins, pills and rows.
 */
export function MapExperience({
  pins = MOCK_NEARBY,
  you = MOCK_YOU,
  title = "Pros near you",
  onSelect,
  className,
}: MapExperienceProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [snap, setSnap] = useState(1); // peek / half / tall

  const focused = pins.find((p) => p.id === focusedId) ?? null;

  const focus = (id: string | null) => {
    setFocusedId(id);
    if (id) setSnap((s) => Math.max(s, 1)); // lift the sheet to show the card
  };

  // Focused pin leads the list, then the rest.
  const ordered = focused ? [focused, ...pins.filter((p) => p.id !== focused.id)] : pins;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div className="absolute inset-0">
        <LiveMap
          interactive
          requestLocation
          you={you}
          pins={pins}
          focusedId={focusedId}
          onFocusPin={focus}
        />
      </div>

      <BottomSheet
        snapPoints={[0.16, 0.46, 0.9]}
        snap={snap}
        onSnapChange={setSnap}
        label={title}
        header={
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h2>
            <span className="text-[13px] font-semibold text-muted-foreground">
              {pins.length} available
            </span>
          </div>
        }
      >
        {pins.length === 0 ? (
          <EmptyState
            icon={MapPinIcon}
            title="No pros in range yet"
            body="Widen your radius or try again in a moment — pros come online all the time."
          />
        ) : (
          <div className="divide-y divide-border">
            {ordered.map((p) => {
              const isFocused = p.id === focusedId;
              return (
                <div key={p.id} className={cn(isFocused && "rounded-md bg-accent/60")}>
                  <ListRow
                    onClick={() => focus(isFocused ? null : p.id)}
                    noChevron={isFocused}
                    leading={
                      <RowIcon className={cn(isFocused && "bg-primary/10")}>
                        <MapPinIcon className={isFocused ? "text-primary" : undefined} />
                      </RowIcon>
                    }
                    title={p.title ?? "Pro"}
                    subtitle={
                      <span className="flex items-center gap-1.5">
                        {p.subtitle}
                      </span>
                    }
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        {typeof p.price === "number" && <Money amount={p.price} size="sm" />}
                        <StatusPill status={p.status} appearance="tint" className="px-2 py-0.5" />
                      </div>
                    }
                  />
                  {isFocused && (
                    <div className="animate-fade-up px-4 pb-4">
                      <div className="flex items-center gap-2 rounded-md bg-card p-3 shadow-card">
                        <Star size={15} className="text-premium" fill="currentColor" />
                        <span className="text-[13px] font-semibold text-foreground">{p.subtitle}</span>
                        {typeof p.price === "number" && (
                          <span className="ml-auto text-[12.5px] font-medium text-muted-foreground">
                            from <Money amount={p.price} size="sm" className="text-foreground" />
                          </span>
                        )}
                      </div>
                      <Button className="mt-3 w-full" onClick={() => onSelect?.(p)}>
                        Choose {p.title?.split(" ")[0] ?? "this pro"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
