"use client";

import { motion } from "framer-motion";
import { Zap, Globe, Shuffle, ArrowDownUp, Bug } from "lucide-react";
import { rootCauseSummary } from "@/lib/demoData";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Shuffle: <Shuffle className="w-4 h-4" />,
  ArrowDownUp: <ArrowDownUp className="w-4 h-4" />,
};

export default function FlakyRootCause() {
  const totalScore = rootCauseSummary.reduce((sum, c) => sum + c.score, 0);

  if (totalScore === 0) return null;

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
              Flaky Test Root Cause Classifier
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Left: Bar Chart Breakdown */}
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-6">
              <Bug className="w-4 h-4 text-warning" />
              <h3 className="text-xs font-mono text-muted uppercase tracking-wider">
                WHY Are Tests Flaky?
              </h3>
            </div>

            <div className="space-y-4">
              {rootCauseSummary.map((cause, i) => (
                <motion.div
                  key={cause.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-lg"
                        style={{ backgroundColor: `${cause.color}15`, color: cause.color }}
                      >
                        {iconMap[cause.icon] || <Bug className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{cause.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono" style={{ color: cause.color }}>
                        {cause.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${cause.percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cause.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Classification Cards */}
          <div className="space-y-3">
            {rootCauseSummary.map((cause, i) => {
              const descriptions: Record<string, { detail: string; fix: string }> = {
                race_condition: {
                  detail: "Tests use sleep(), setTimeout(), or async code without proper synchronization. Results vary depending on machine speed and load.",
                  fix: "Replace sleep-based waits with proper event-driven assertions (waitFor, eventually, polling).",
                },
                order_dependency: {
                  detail: "Tests depend on execution order or shared state from setUp/tearDown. Running tests in isolation or different order causes failures.",
                  fix: "Isolate test state. Each test should create and clean up its own data. Avoid global singletons.",
                },
                env_pollution: {
                  detail: "Tests depend on external resources: env vars, network calls, databases, filesystem. These vary across environments.",
                  fix: "Mock external dependencies. Use test containers or in-memory stores. Never rely on real network.",
                },
                true_flaky: {
                  detail: "Tests use random(), Date.now(), or UUIDs making output non-deterministic. No way to get consistent results.",
                  fix: "Seed random generators. Mock Date.now(). Use deterministic IDs in tests.",
                },
              };
              const info = descriptions[cause.id] || { detail: "Unknown", fix: "Investigate further." };

              return (
                <motion.div
                  key={cause.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: `${cause.color}05`,
                    borderColor: `${cause.color}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-md"
                      style={{ backgroundColor: `${cause.color}15`, color: cause.color }}
                    >
                      {iconMap[cause.icon] || <Bug className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: cause.color }}>
                      {cause.label}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-muted px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${cause.color}10`, color: cause.color }}>
                      {cause.score} hits
                    </span>
                  </div>
                  <p className="text-xs text-muted-light leading-relaxed mb-2">{info.detail}</p>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-mono text-ecg-green font-semibold mt-0.5">FIX →</span>
                    <p className="text-[11px] text-ecg-green/80 leading-relaxed">{info.fix}</p>
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
