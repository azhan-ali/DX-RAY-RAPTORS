"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  FlaskConical,
  GitCommitHorizontal,
  GitPullRequest,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useReport } from "@/lib/ReportContext";

const iconMap: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-5 h-5" />,
  FlaskConical: <FlaskConical className="w-5 h-5" />,
  GitCommitHorizontal: <GitCommitHorizontal className="w-5 h-5" />,
  GitPullRequest: <GitPullRequest className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
};

function getStatusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return "#22c55e";
}

interface DimensionData {
  id: string;
  name: string;
  shortName: string;
  score: number;
  previousScore: number;
  delta: number;
  status: string;
  signals: { day: number; date: string; value: number }[];
  icon: string;
  description: string;
  unit: string;
}

function VitalCard({ dimension, index }: { dimension: DimensionData; index: number }) {
  const color = getStatusColor(dimension.status);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 45;
    const delay = index * 150;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * dimension.score));
        if (frame >= totalFrames) clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [dimension.score, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative group p-5 rounded-2xl bg-surface border border-border card-hover overflow-hidden`}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {iconMap[dimension.icon]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{dimension.shortName}</h3>
            <p className="text-[10px] font-mono text-muted uppercase tracking-wider">{dimension.unit}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono ${dimension.delta >= 0 ? "text-healthy" : "text-critical"}`}>
          {dimension.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {dimension.delta >= 0 ? "+" : ""}{dimension.delta}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-bold font-mono tracking-tighter" style={{ color }}>
          {displayScore}
        </span>
        <span className="text-xs text-muted font-mono mb-1">/100</span>
      </div>

      {/* Mini Sparkline */}
      <div className="h-12 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dimension.signals}>
              <defs>
                <linearGradient id={`gradient-${dimension.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#gradient-${dimension.id})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
      </div>

      {/* Status bar */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
            {dimension.description.split(",")[0]}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{
              color,
              backgroundColor: `${color}10`,
              border: `1px solid ${color}25`,
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
            {dimension.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function VitalSigns() {
  const { report } = useReport();
  const dimensions = report?.dimensions ?? [];

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
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              Vital Signs
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {dimensions.map((dim: DimensionData, i: number) => (
            <VitalCard key={dim.id} dimension={dim} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
