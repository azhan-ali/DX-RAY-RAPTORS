"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { overallScore, previousOverallScore, repoInfo, devHoursWasted } from "@/lib/demoData";

function getScoreColor(score: number) {
  if (score >= 70) return { color: "#22c55e", label: "Healthy", glow: "glow-green" };
  if (score >= 50) return { color: "#f59e0b", label: "Warning", glow: "glow-amber" };
  return { color: "#ef4444", label: "Critical", glow: "glow-red" };
}

export default function HeroScore() {
  const [displayScore, setDisplayScore] = useState(0);
  const { color, label, glow } = getScoreColor(overallScore);
  const delta = overallScore - previousOverallScore;

  useEffect(() => {
    let frame = 0;
    const totalFrames = 60;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * overallScore));
      if (frame >= totalFrames) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      
      {/* Scan line effect */}
      <div className="absolute inset-0 scan-overlay overflow-hidden" />

      <div className="relative max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
          
          {/* Score Circle */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex-shrink-0"
          >
            <div className={`relative w-56 h-56 rounded-full ${glow}`}>
              {/* Outer ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r="88"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="100" cy="100" r="88"
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={553}
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * overallScore) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              
              {/* Score number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-7xl font-bold font-mono tracking-tighter"
                  style={{ color }}
                >
                  {displayScore}
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-muted-light mt-1">
                  DX Score
                </span>
              </div>

              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  border: `2px solid ${color}`,
                  opacity: 0.2,
                }}
              />
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 max-w-2xl"
          >
            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono uppercase tracking-wider"
                style={{
                  color,
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                {label}
              </span>
              <span className={`text-xs font-mono ${delta >= 0 ? "text-healthy" : "text-critical"}`}>
                {delta >= 0 ? "+" : ""}{delta} from last week
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
              This repository is{" "}
              <span style={{ color }} className={overallScore < 50 ? "text-glow-red" : ""}>
                {label === "Critical" ? "bleeding dev-hours" : label === "Warning" ? "showing symptoms" : "in good shape"}
              </span>
            </h1>

            <p className="text-base text-muted-light leading-relaxed mb-6">
              DevPulse scanned <span className="text-foreground font-medium">{repoInfo.name}</span> in{" "}
              <span className="text-accent-cyan font-mono">{repoInfo.scanDuration}</span> and analyzed{" "}
              <span className="text-foreground font-medium">{repoInfo.totalCommits.toLocaleString()} commits</span> from{" "}
              <span className="text-foreground font-medium">{repoInfo.contributors} contributors</span>.
              This is not a dashboard — this is an X-ray.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<AlertTriangle className="w-4 h-4 text-critical" />}
                value={`${devHoursWasted.total}`}
                unit="dev-hrs/mo"
                label="Wasted"
                accent="#ef4444"
              />
              <StatCard
                icon={<TrendingDown className="w-4 h-4 text-warning" />}
                value="3"
                unit="anomalies"
                label="Detected"
                accent="#f59e0b"
              />
              <StatCard
                icon={<Activity className="w-4 h-4 text-accent-cyan" />}
                value="5"
                unit="dimensions"
                label="Scanned"
                accent="#00d4ff"
              />
              <StatCard
                icon={<Clock className="w-4 h-4 text-ecg-green" />}
                value="5"
                unit="fixes"
                label="Generated"
                accent="#00ff41"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  unit,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="relative group p-3 rounded-xl bg-surface border border-border card-hover">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-xs text-muted">{unit}</span>
      </div>
    </div>
  );
}
