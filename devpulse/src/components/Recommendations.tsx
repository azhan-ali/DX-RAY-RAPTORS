"use client";

import { motion } from "framer-motion";
import { useReport } from "@/lib/ReportContext";
import { Clock, AlertTriangle, ArrowRight, Zap, Info, AlertCircle } from "lucide-react";

function getSeverityConfig(severity: string) {
  if (severity === "critical")
    return { color: "#ef4444", bg: "bg-critical/5", border: "border-critical/20", icon: <AlertTriangle className="w-4 h-4" /> };
  if (severity === "warning")
    return { color: "#f59e0b", bg: "bg-warning/5", border: "border-warning/20", icon: <AlertCircle className="w-4 h-4" /> };
  return { color: "#00d4ff", bg: "bg-accent-cyan/5", border: "border-accent-cyan/20", icon: <Info className="w-4 h-4" /> };
}

function getEffortBadge(effort: string) {
  if (effort === "low") return { label: "Quick Fix", color: "#22c55e" };
  if (effort === "medium") return { label: "Moderate", color: "#f59e0b" };
  return { label: "Significant", color: "#ef4444" };
}

export default function Recommendations() {
  const { report } = useReport();
  const recommendations = report?.recommendations ?? [];
  const anomalyEvents = report?.anomalyEvents ?? [];
  const devHoursWasted = typeof report?.devHoursWasted === "object" ? report.devHoursWasted?.total ?? 0 : report?.devHoursWasted ?? 0;

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
            <span className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              Ranked Recommendations
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendations List */}
          <div className="lg:col-span-2 space-y-3">
            {recommendations.map((rec: any, index: number) => {
              const severity = getSeverityConfig(rec.severity ?? rec.impact ?? "info");
              const effort = getEffortBadge(rec.effort ?? "medium");

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`group relative p-5 rounded-xl ${severity.bg} border ${severity.border} card-hover`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-sm"
                      style={{ color: severity.color, backgroundColor: `${severity.color}15` }}
                    >
                      #{index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">{rec.title}</h4>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                          style={{
                            color: effort.color,
                            backgroundColor: `${effort.color}10`,
                            border: `1px solid ${effort.color}25`,
                          }}
                        >
                          {effort.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-light leading-relaxed">{rec.description}</p>
                    </div>

                    {/* Savings Badge */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1.5" style={{ color: severity.color }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-lg font-bold font-mono">{rec.devHoursSaved}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted">hrs/mo saved</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Anomaly Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-warning" />
                Anomaly Timeline
              </h3>

              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                {anomalyEvents.map((event: any, i: number) => (
                  <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className="w-[23px] h-[23px] rounded-full bg-surface border-2 border-critical flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-critical" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {event.date}
                        </span>
                        <span className="text-[10px] font-mono text-critical px-1.5 py-0.5 rounded bg-critical/10 border border-critical/20">
                          z={event.zScore}
                        </span>
                      </div>
                      <p className="text-xs text-muted-light leading-relaxed mb-1">
                        {event.description}
                      </p>
                      <p className="text-[10px] font-mono text-muted">
                        Commits: {event.commitRange}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Impact */}
            <div className="p-5 rounded-2xl bg-critical/5 border border-critical/20">
              <p className="text-xs font-mono text-critical uppercase tracking-wider mb-2">
                Total Monthly Impact
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-critical text-glow-red">{devHoursWasted}</span>
                <span className="text-sm text-muted-light">dev-hours wasted per month</span>
              </div>
              <p className="text-xs text-muted mt-2">
                Equivalent to <span className="text-foreground font-medium">{(devHoursWasted / 8).toFixed(1)} full developer-days</span> lost
                every month on preventable issues.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
