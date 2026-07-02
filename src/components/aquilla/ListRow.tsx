import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListRowProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Leading visual — an icon in a tinted squircle, an avatar, etc. */
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Trailing content (money, status pill). Chevron is added when tappable. */
  trailing?: React.ReactNode;
  /** Hide the chevron even when onClick is present. */
  noChevron?: boolean;
  /** Hairline under the row (lists), off for standalone cards. */
  divider?: boolean;
}

/**
 * The standard tappable row: 56px min height (comfortable thumb target),
 * press feedback, focus ring, semantic <button> so keyboard and screen
 * readers get the whole row as one action.
 */
export const ListRow = React.forwardRef<HTMLButtonElement, ListRowProps>(
  ({ leading, title, subtitle, trailing, noChevron, divider, className, ...props }, ref) => {
    const tappable = !!props.onClick;
    return (
      <button
        ref={ref}
        type="button"
        disabled={!tappable && props.disabled !== false}
        className={cn(
          "flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left transition-colors",
          tappable && "active:bg-secondary/70 hover:bg-muted cursor-pointer",
          !tappable && "cursor-default",
          divider && "border-b border-border last:border-b-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "disabled:opacity-100", // non-tappable rows are not "disabled"-looking
          className,
        )}
        {...props}
      >
        {leading && <span className="flex shrink-0 items-center">{leading}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-foreground">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-[13px] font-medium text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
        {tappable && !noChevron && (
          <ChevronRight aria-hidden size={18} className="shrink-0 text-muted-foreground/60" />
        )}
      </button>
    );
  },
);
ListRow.displayName = "ListRow";

/** Tinted icon squircle for ListRow leading slots. */
export function RowIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-11 w-11 place-items-center rounded-sm bg-secondary text-foreground [&_svg]:size-5",
        className,
      )}
    >
      {children}
    </span>
  );
}
