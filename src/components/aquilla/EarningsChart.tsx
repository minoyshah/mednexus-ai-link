import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipProps,
} from "recharts";

export interface EarningsDatum {
  label: string;
  amount: number;
}

/** Resolve a token to a concrete color Recharts can paint (SVG attrs can't read vars). */
function token(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw})` : fallback;
}

function EarningsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-float">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="tnum text-[15px] font-extrabold text-foreground">
        {value.toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>
    </div>
  );
}

/**
 * Token-styled earnings area chart (cobalt gradient). Default export so it can
 * be lazy-loaded — Recharts then lands in its own chunk and never weighs down
 * first paint.
 */
export default function EarningsChart({ data }: { data: EarningsDatum[] }) {
  const brand = token("--primary", "#2E5BFF");
  const axis = token("--muted-foreground", "#6B7280");

  return (
    <ResponsiveContainer width="100%" height={172}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="aqEarnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brand} stopOpacity={0.28} />
            <stop offset="100%" stopColor={brand} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: axis, fontSize: 11, fontWeight: 600 }}
          dy={6}
          interval="preserveStartEnd"
        />
        <Tooltip
          content={<EarningsTooltip />}
          cursor={{ stroke: brand, strokeOpacity: 0.25, strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={brand}
          strokeWidth={2.5}
          fill="url(#aqEarnFill)"
          dot={false}
          activeDot={{ r: 4, fill: brand, stroke: "#fff", strokeWidth: 2 }}
          animationDuration={420}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
