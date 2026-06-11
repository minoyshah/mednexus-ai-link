import { cn } from "@/lib/utils";

interface MoneyProps {
  /** Dollar amount (the app works in dollars; cents only at the Stripe edge). */
  amount: number;
  /** Show explicit sign for credits/debits (earnings vs refunds). */
  signed?: boolean;
  /** Visual weight presets used across cards, rows and the earnings header. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Dim it (historical rows, struck-through quotes). */
  muted?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<MoneyProps["size"]>, string> = {
  sm: "text-[13px] font-semibold",
  md: "text-[15px] font-bold",
  lg: "text-xl font-extrabold tracking-tight",
  xl: "text-[32px] font-extrabold tracking-tight",
};

/**
 * Money is always tabular-nums so totals never jiggle while counting, and
 * always formatted in one place. Cents are dropped on whole-dollar amounts
 * (matches quoted prices) and kept otherwise (fee splits like $94.50).
 */
export function Money({ amount, signed, size = "md", muted, className }: MoneyProps) {
  const abs = Math.abs(amount);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
  const sign = signed ? (amount < 0 ? "−" : "+") : amount < 0 ? "−" : "";

  return (
    <span
      className={cn(
        "tnum whitespace-nowrap",
        SIZES[size],
        muted ? "text-muted-foreground" : "text-foreground",
        signed && amount > 0 && !muted && "text-status-completed",
        className,
      )}
    >
      {sign}
      {formatted}
    </span>
  );
}
