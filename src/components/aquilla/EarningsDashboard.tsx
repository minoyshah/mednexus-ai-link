import { lazy, Suspense, useMemo, useState } from "react";
import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Money } from "./Money";
import { SkeletonCard } from "./Skeletons";
import type { EarningsDatum } from "./EarningsChart";

/** Recharts is heavy and only needed here → its own lazy chunk. */
const EarningsChart = lazy(() => import("./EarningsChart"));

type Period = "week" | "month" | "year";

const PERIOD_LABEL: Record<Period, string> = { week: "This week", month: "This month", year: "This year" };

interface EarningsDashboardProps {
  /** Live session earnings from the pro app (drives "today"). */
  liveEarnings: number;
  jobsDone: number;
  /** 0..1 */
  completionRate: number;
  lowRate: boolean;
}

/**
 * Deterministic mock earnings series per period so the chart is fully
 * populated without live history. `live` is folded into the latest bucket so
 * the session you just earned shows up immediately.
 */
function series(period: Period, live: number): EarningsDatum[] {
  if (period === "week") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = [120, 0, 210, 165, 320, 95, 0];
    return days.map((label, i) => ({ label, amount: base[i] + (i === days.length - 1 ? live : 0) }));
  }
  if (period === "month") {
    const base = [640, 880, 720, 0];
    return base.map((amount, i) => ({ label: `Wk ${i + 1}`, amount: amount + (i === base.length - 1 ? live : 0) }));
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const base = [1850, 2100, 1740, 2480, 2210, 2640, 2900, 2750, 2380, 0, 0, 0];
  return months.map((label, i) => ({ label, amount: base[i] + (i === 8 ? live : 0) }));
}

export function EarningsDashboard({ liveEarnings, jobsDone, completionRate, lowRate }: EarningsDashboardProps) {
  const [period, setPeriod] = useState<Period>("week");
  const data = useMemo(() => series(period, liveEarnings), [period, liveEarnings]);

  const gross = data.reduce((s, d) => s + d.amount, 0);
  const fee = Math.round(gross * 0.15 * 100) / 100; // Aquilla's 15% labor cut
  const net = Math.round((gross - fee) * 100) / 100;
  const best = data.reduce((m, d) => Math.max(m, d.amount), 0);

  return (
    <div className="px-5 pt-12">
      <h1 className="text-[26px] font-extrabold tracking-tight">Earnings</h1>

      {/* Period toggle */}
      <div className="mt-4 flex rounded-full bg-secondary p-1">
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={cn(
              "flex-1 rounded-full py-1.5 text-[13px] font-bold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              period === p ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Hero: period net + the live session */}
      <div className="mt-4 overflow-hidden rounded-lg bg-foreground p-5 text-background shadow-card">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold opacity-70">
          <Wallet size={14} /> {PERIOD_LABEL[period]} · net payout
        </div>
        <Money amount={net} size="xl" className="mt-1 block text-background" />
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium opacity-70">
          <TrendingUp size={13} className="text-status-arrived" />
          <Money amount={gross} size="sm" className="text-background" /> earned ·{" "}
          <Money amount={fee} size="sm" className="text-background" /> service fee
        </div>
      </div>

      {/* Chart */}
      {gross === 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-[14px] font-semibold text-foreground">No earnings yet this {period}</p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            Completed jobs show up here, paid out instantly.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-card p-3 pt-4 shadow-card">
          <Suspense fallback={<SkeletonCard className="border-0 shadow-none" />}>
            <EarningsChart data={data} />
          </Suspense>
          <div className="mt-1 px-1 text-[11.5px] font-medium text-muted-foreground">
            Best {period === "year" ? "month" : period === "month" ? "week" : "day"}:{" "}
            <Money amount={best} size="sm" className="text-foreground" />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary p-4">
          <div className="tnum text-2xl font-extrabold">{jobsDone}</div>
          <div className="text-[13px] font-medium text-muted-foreground">Jobs completed</div>
        </div>
        <div className={cn("rounded-lg p-4", lowRate ? "bg-destructive/10" : "bg-secondary")}>
          <div className={cn("tnum text-2xl font-extrabold", lowRate && "text-destructive")}>
            {Math.round(completionRate * 100)}%
          </div>
          <div className={cn("text-[13px] font-medium", lowRate ? "text-destructive" : "text-muted-foreground")}>
            Completion rate
          </div>
        </div>
      </div>

      {lowRate && (
        <div role="alert" className="mt-3 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <span className="text-[12.5px] leading-relaxed text-destructive">
            Your completion rate is below 50%, so new jobs and the visit fee are paused. Complete jobs to restore your account.
          </span>
        </div>
      )}

      <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Payouts arrive instantly after each completed job, minus Aquilla's 15% service fee (5% on parts).
      </p>
    </div>
  );
}
