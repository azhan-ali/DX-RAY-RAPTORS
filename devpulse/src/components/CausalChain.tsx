"use client";

import { motion } from "framer-motion";
import { useReport } from "@/lib/ReportContext";

function getStatusColor(status: string) {
  if (status === "critical") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return "#22c55e";
}

const nodePositions: Record<string, { x: number; y: number }> = {
  "test-stability": { x: 80, y: 80 },
  "test_stability": { x: 80, y: 80 },
  "ci-build": { x: 320, y: 80 },
  "ci_build": { x: 320, y: 80 },
  "commit-velocity": { x: 560, y: 80 },
  "commit_velocity": { x: 560, y: 80 },
  "review-lag": { x: 320, y: 250 },
  "code_review": { x: 320, y: 250 },
  "doc-freshness": { x: 560, y: 250 },
  "doc_freshness": { x: 560, y: 250 },
};

export default function CausalChain() {
  const { report } = useReport();
  const causalLinks = report?.causalLinks ?? [];
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
            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              Causal Correlation Engine
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 relative rounded-2xl bg-surface border border-border overflow-hidden p-6"
          >
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                Time-Lagged Pearson Correlation Map
              </span>
            </div>

            <svg viewBox="0 0 660 340" className="w-full h-auto mt-4">
              {/* Grid background */}
              <defs>
                <pattern id="causal-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" opacity="0.7" />
                </marker>
              </defs>
              <rect width="660" height="340" fill="url(#causal-grid)" opacity="0.3" />

              {/* Connection lines */}
              {causalLinks.map((link: any, i: number) => {
                const from = nodePositions[link.from];
                const to = nodePositions[link.to];
                if (!from || !to) return null;

                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2 - 20;

                return (
                  <g key={i}>
                    <motion.path
                      d={`M ${from.x + 40} ${from.y + 20} Q ${midX} ${midY} ${to.x - 10} ${to.y + 20}`}
                      fill="none"
                      stroke="#00d4ff"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      markerEnd="url(#arrowhead)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.6 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.2 }}
                    />
                    {/* Correlation label */}
                    <g transform={`translate(${midX - 20}, ${midY - 8})`}>
                      <rect
                        x="0"
                        y="0"
                        width="45"
                        height="18"
                        rx="4"
                        fill="#0d1321"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                      <text
                        x="22.5"
                        y="13"
                        textAnchor="middle"
                        className="text-[10px] font-mono"
                        fill="#00d4ff"
                      >
                        r={link.correlation}
                      </text>
                    </g>
                    {/* Lag label */}
                    <g transform={`translate(${midX + 28}, ${midY - 8})`}>
                      <rect
                        x="0"
                        y="0"
                        width="35"
                        height="18"
                        rx="4"
                        fill="#0d1321"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                      <text
                        x="17.5"
                        y="13"
                        textAnchor="middle"
                        className="text-[10px] font-mono"
                        fill="#64748b"
                      >
                        {link.lag}d
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Nodes */}
              {dimensions.map((dim: any, i: number) => {
                const pos = nodePositions[dim.id];
                if (!pos) return null;
                const color = getStatusColor(dim.status);

                return (
                  <motion.g
                    key={dim.id}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    {/* Glow */}
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y + 20}
                      r="35"
                      fill={color}
                      opacity="0.05"
                    />
                    {/* Node circle */}
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y + 20}
                      r="28"
                      fill="#0d1321"
                      stroke={color}
                      strokeWidth="2"
                    />
                    {/* Score */}
                    <text
                      x={pos.x + 20}
                      y={pos.y + 16}
                      textAnchor="middle"
                      fill={color}
                      className="text-lg font-bold font-mono"
                      fontSize="18"
                    >
                      {dim.score}
                    </text>
                    {/* Label */}
                    <text
                      x={pos.x + 20}
                      y={pos.y + 28}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8"
                      className="font-mono uppercase"
                    >
                      /100
                    </text>
                    {/* Name below */}
                    <text
                      x={pos.x + 20}
                      y={pos.y + 58}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="11"
                      className="font-medium"
                    >
                      {dim.shortName}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          </motion.div>

          {/* Causal Chain Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-4">
              Detected Causal Chains
            </h3>
            {causalLinks.map((link: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-surface border border-border card-hover"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-accent-cyan font-mono text-xs font-bold">
                    r={link.correlation}
                  </span>
                  <span className="text-[10px] font-mono text-muted px-2 py-0.5 rounded bg-surface-light border border-border">
                    lag={link.lag}d
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {link.description}
                </p>
              </div>
            ))}

            {/* Key Insight */}
            {causalLinks.length > 0 && (
              <div className="p-4 rounded-xl bg-accent-cyan/5 border border-accent-cyan/20">
                <p className="text-xs font-mono text-accent-cyan uppercase tracking-wider mb-2">
                  Key Insight
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  Strongest correlation: <span className="text-accent-cyan font-semibold">r={causalLinks[0].correlation}</span> — {causalLinks[0].description}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
