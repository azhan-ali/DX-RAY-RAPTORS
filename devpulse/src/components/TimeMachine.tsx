"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useReport } from "@/lib/ReportContext";

interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ForecastTooltip({ active, payload, label }: ForecastTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted">{entry.name}:</span>
          <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TimeMachine() {
  const { report } = useReport();
  const forecastData = report?.forecast ?? [];
  const devHoursWasted = typeof report?.devHoursWasted === "object"
    ? report.devHoursWasted
    : { total: report?.devHoursWasted ?? 0, breakdown: [] };

  // Build breakdown from devHoursBreakdown if available
  const breakdown = report?.devHoursBreakdown?.length
    ? report.devHoursBreakdown.map((item: any) => ({
        dimension: item.dimension,
        hours: item.totalHours,
        percentage: devHoursWasted.total > 0 ? Math.round((item.totalHours / (typeof devHoursWasted.total === 'number' ? devHoursWasted.total : report?.devHoursWasted ?? 1)) * 100) : 0,
      }))
    : devHoursWasted.breakdown ?? [];
  const totalHours = typeof devHoursWasted === "object" ? devHoursWasted.total : devHoursWasted;

  // Get fix/doNothing end values for Two Futures panel
  const lastForecast = forecastData.length > 0 ? forecastData[forecastData.length - 1] : null;
  const fixNowScore = lastForecast?.fixNow ?? 67;
  const doNothingScore = lastForecast?.doNothing ?? 28;

  return (
    <section className="py-12">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              DX Time Machine
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forecast Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 rounded-2xl bg-surface border border-border overflow-hidden"
          >
            {/* Chart Header */}
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border bg-surface-light">
              <span className="text-[10px] sm:text-xs font-mono text-muted uppercase tracking-wider">
                30-Day DX Score Forecast
              </span>
              <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-ecg-green rounded" />
                  <span className="text-healthy">Fix Now</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-critical rounded" />
                  <span className="text-critical">Do Nothing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-accent-cyan rounded" />
                  <span className="text-accent-cyan">Historical</span>
                </div>
              </div>
            </div>

            <div className="p-2 sm:p-6 h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} key={JSON.stringify(forecastData.slice(0, 2))}>
                  <defs>
                    <linearGradient id="forecast-fix" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecast-nothing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    stroke="#334155"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#334155"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[20, 80]}
                  />
                  <Tooltip content={<ForecastTooltip />} />
                  <ReferenceLine x="Now" stroke="#00d4ff" strokeDasharray="6 3" strokeWidth={1} opacity={0.5} />
                  <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" label={{ value: "Warning Threshold", fill: "#64748b", fontSize: 10, position: "insideTopRight" }} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    fill="none"
                    dot={{ r: 3, fill: "#00d4ff", stroke: "#0d1321", strokeWidth: 2 }}
                    connectNulls={false}
                    name="Historical"
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="fixNow"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#forecast-fix)"
                    dot={{ r: 3, fill: "#22c55e", stroke: "#0d1321", strokeWidth: 2 }}
                    connectNulls={false}
                    name="Fix Now"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationBegin={500}
                  />
                  <Area
                    type="monotone"
                    dataKey="doNothing"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#forecast-nothing)"
                    dot={{ r: 3, fill: "#ef4444", stroke: "#0d1321", strokeWidth: 2 }}
                    connectNulls={false}
                    name="Do Nothing"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationBegin={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Forecast Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Two Futures */}
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">
                Two Futures
              </h3>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-healthy/5 border border-healthy/20">
                  <p className="text-xs font-mono text-healthy uppercase tracking-wider mb-1">
                    If you fix now
                  </p>
                  <p className="text-3xl font-bold font-mono text-healthy">{fixNowScore}</p>
                  <p className="text-xs text-muted mt-1">DX Score in 30 days</p>
                </div>

                <div className="p-3 rounded-xl bg-critical/5 border border-critical/20">
                  <p className="text-xs font-mono text-critical uppercase tracking-wider mb-1">
                    If you do nothing
                  </p>
                  <p className="text-3xl font-bold font-mono text-critical">{doNothingScore}</p>
                  <p className="text-xs text-muted mt-1">DX Score in 30 days</p>
                </div>
              </div>
            </div>

            {/* Cost of Inaction */}
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-4">
                Cost of Inaction
              </h3>
              <div className="space-y-3">
                {breakdown.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-light">{item.dimension}</span>
                      <span className="text-xs font-mono text-foreground">
                        {item.hours} hrs/mo
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.percentage}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                        className="h-full rounded-full bg-critical"
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total Wasted</span>
                  <span className="text-xl font-bold font-mono text-critical">
                    {totalHours} hrs/mo
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
