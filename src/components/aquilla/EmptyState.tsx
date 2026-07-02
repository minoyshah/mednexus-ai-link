import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  /** Primary action, e.g. "Book your first job". */
  actionLabel?: string;
  onAction?: () => void;
  /** error flips the icon tint to destructive and offers retry semantics. */
  tone?: "default" | "error";
  className?: string;
}

/**
 * Empty / error state used by every list and panel: friendly, centered,
 * one clear next action. Never a bare "No data".
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("flex flex-col items-center px-6 py-12 text-center", className)}
    >
      {Icon && (
        <span
          aria-hidden
          className={cn(
            "mb-4 grid h-16 w-16 place-items-center rounded-lg",
            tone === "error" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
          )}
        >
          <Icon size={28} strokeWidth={2.2} />
        </span>
      )}
      <h3 className="text-[17px] font-bold text-foreground">{title}</h3>
      {body && (
        <p className="mt-1.5 max-w-[26ch] text-[13.5px] font-medium leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant={tone === "error" ? "outline" : "default"}
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
