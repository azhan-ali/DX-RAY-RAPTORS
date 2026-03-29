"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Clock, Shield, Zap } from "lucide-react";
import { useReport } from "@/lib/ReportContext";

const iconMap: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  FlaskConical: <Shield className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
};

const colorMap: Record<string, string> = {
  "#22c55e": "#22c55e",
  "#00d4ff": "#00d4ff",
  "#a855f7": "#a855f7",
  "#ef4444": "#ef4444",
};

export default function BeforeAfter() {
  const { report } = useReport();
  const beforeAfter = report?.beforeAfter ?? [];
  const devHoursWasted = typeof report?.devHoursWasted === "object" ? report.devHoursWasted?.total ?? 0 : report?.devHoursWasted ?? 0;

  const comparisons = beforeAfter.map((item: any) => ({
    metric: item.label,
    before: item.before,
    after: item.after,
    improvement: item.improvement,
    icon: iconMap[item.icon] ?? <TrendingUp className="w-4 h-4" />,
    color: colorMap[item.color] ?? item.color ?? "#22c55e",
  }));

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
            <span className="w-1.5 h-1.5 rounded-full bg-healthy animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              Before / After
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        {/* Comparison intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
            Measurable Impact After Applying Fixes
          </h2>
          <p className="text-sm text-muted-light max-w-xl mx-auto">
            DevPulse doesn&apos;t just diagnose — it proves improvement. Here&apos;s what changed after
            applying the top 2 recommended fixes.
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparisons.map((item, index) => (
            <motion.div
              key={item.metric}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group rounded-2xl bg-surface border border-border card-hover overflow-hidden"
            >
              {/* Top accent */}
              <div
                className="h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
              />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.metric}</span>
                </div>

                {/* Before → After */}
                <div className="flex items-center justify-between gap-2">
                  {/* Before */}
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
                      Before
                    </p>
                    <p className="text-xl font-bold font-mono text-critical">{item.before}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <motion.div
                      initial={{ x: -5, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <ArrowRight className="w-5 h-5 text-muted" />
                    </motion.div>
                  </div>

                  {/* After */}
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">
                      After
                    </p>
                    <p className="text-xl font-bold font-mono" style={{ color: item.color }}>
                      {item.after}
                    </p>
                  </div>
                </div>

                {/* Improvement badge */}
                <div className="mt-4 pt-3 border-t border-border/50 flex justify-center">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}10`,
                      border: `1px solid ${item.color}25`,
                    }}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {item.improvement}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-ecg-green/5 via-accent-cyan/5 to-accent-purple/5 border border-ecg-green/20 text-center"
        >
          <p className="text-sm text-muted-light mb-2">
            Combined impact of applying DevPulse recommendations:
          </p>
          <p className="text-lg font-semibold text-foreground">
            <span className="text-ecg-green font-mono text-glow-green">{devHoursWasted} dev-hours/month</span>{" "}
            recovered — equivalent to{" "}
            <span className="text-accent-cyan font-mono text-glow-cyan">${Math.round(devHoursWasted * 300).toLocaleString()}/month</span>{" "}
            at average engineer cost
          </p>
        </motion.div>
      </div>
    </section>
  );
}
