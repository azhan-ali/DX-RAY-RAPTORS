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
} from "recharts";
import { useReport } from "@/lib/ReportContext";

function getStatusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return "#22c55e";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; day: number } }>;
  color: string;
  name: string;
}

function CustomTooltip({ active, payload, color, name }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">{name}</p>
      <p className="text-xs text-muted">{payload[0].payload.date}</p>
      <p className="text-lg font-bold font-mono" style={{ color }}>
        {payload[0].value.toFixed(1)}
      </p>
    </div>
  );
}

export default function ECGSparklines() {
  const { report } = useReport();
  const dimensions = report?.dimensions ?? [];
  const anomalyEvents = report?.anomalyEvents ?? [];

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
            <span className="w-1.5 h-1.5 rounded-full bg-ecg-green animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              28-Day ECG Monitor
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        {/* ECG Monitor Frame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl bg-surface border border-border overflow-hidden"
        >
          {/* Monitor header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-light">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-critical/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-healthy/50" />
              </div>
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                DEVPULSE ECG MONITOR v1.0
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
              <span className="text-ecg-green">LIVE</span>
              <span>•</span>
              <span>28-DAY WINDOW</span>
              <span>•</span>
              <span>5 CHANNELS</span>
            </div>
          </div>

          {/* ECG Rows */}
          <div className="divide-y divide-border/50">
            {dimensions.map((dim: any, index: number) => {
              const color = getStatusColor(dim.status);
              const anomaly = anomalyEvents.find((a: any) => a.dimension === dim.id || a.dimension === dim.shortName);

              return (
                <motion.div
                  key={dim.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-stretch"
                >
                  {/* Channel label */}
                  <div className="flex-shrink-0 w-44 p-4 border-r border-border/50 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {dim.shortName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                      Score: <span style={{ color }}>{dim.score}</span>/100
                    </span>
                    {anomaly && (
                      <span className="mt-1 text-[10px] font-mono text-critical">
                        ANOMALY {anomaly.date}
                      </span>
                    )}
                  </div>

                  {/* Sparkline */}
                  <div className="flex-1 h-24 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dim.signals}>
                        <defs>
                          <linearGradient
                            id={`ecg-grad-${dim.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          hide
                        />
                        <YAxis hide domain={[0, 100]} />
                        <ReferenceLine y={50} stroke="#1e293b" strokeDasharray="3 3" />
                        <Tooltip
                          content={<CustomTooltip color={color} name={dim.shortName} />}
                          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={color}
                          strokeWidth={2}
                          fill={`url(#ecg-grad-${dim.id})`}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: color,
                            stroke: "#0d1321",
                            strokeWidth: 2,
                          }}
                          isAnimationActive={true}
                          animationDuration={2000}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
