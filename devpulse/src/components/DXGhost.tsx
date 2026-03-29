"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReport } from "@/lib/ReportContext";
import { FileCode, ChevronDown, ChevronUp, Zap, Check } from "lucide-react";

function parseDiffToLines(diff: string): { type: "add" | "remove" | "neutral"; content: string }[] {
  if (!diff) return [];
  return diff.split("\n").map((line) => {
    if (line.startsWith("+")) return { type: "add" as const, content: line.slice(1) };
    if (line.startsWith("-")) return { type: "remove" as const, content: line.slice(1) };
    return { type: "neutral" as const, content: line };
  });
}

export default function DXGhost() {
  const { report } = useReport();
  const rawPatches = report?.ghostPatches ?? [];
  const [expandedPatch, setExpandedPatch] = useState<number>(0);

  // Normalize patches: handle both API format (diff string) and demo format (lines array)
  const ghostPatches = rawPatches.map((p: any, i: number) => ({
    file: p.file ?? "unknown",
    description: p.title ?? p.description ?? "",
    estimatedSaving: p.impact ?? p.estimatedSaving ?? "N/A",
    confidence: p.confidence ?? 0,
    patchType: p.patchType ?? null,
    simulatedOutcome: p.simulatedOutcome ?? null,
    lines: p.lines ?? parseDiffToLines(p.diff ?? ""),
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
            <span className="w-1.5 h-1.5 rounded-full bg-ecg-green animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-light">
              DX Ghost — AI Fix Writer
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </motion.div>

        {/* Ghost Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 p-4 rounded-xl bg-ecg-green/5 border border-ecg-green/20"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-ecg-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                DX Ghost analyzed your repository and generated {ghostPatches.length} ready-to-apply patches
              </p>
              <p className="text-xs text-muted-light">
                Each patch targets a specific bottleneck with estimated impact. Review the diffs below and apply with{" "}
                <code className="text-ecg-green bg-ecg-green/10 px-1.5 py-0.5 rounded text-[11px] font-mono">
                  git apply
                </code>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Patches */}
        <div className="space-y-4">
          {ghostPatches.map((patch, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="rounded-2xl bg-surface border border-border overflow-hidden"
            >
              {/* Patch Header */}
              <button
                onClick={() => setExpandedPatch(expandedPatch === index ? -1 : index)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-light transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ecg-green/10 border border-ecg-green/20">
                    <FileCode className="w-4 h-4 text-ecg-green" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {patch.file}
                    </p>
                    <p className="text-xs text-muted-light">{patch.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-ecg-green/10 text-ecg-green border border-ecg-green/20">
                    <Zap className="w-3 h-3" />
                    {patch.estimatedSaving}
                  </span>
                  {expandedPatch === index ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {/* Patch Diff */}
              <AnimatePresence>
                {expandedPatch === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border">
                      {/* Terminal-style header */}
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#080c14] border-b border-border/50">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-critical/50" />
                          <span className="w-2 h-2 rounded-full bg-warning/50" />
                          <span className="w-2 h-2 rounded-full bg-healthy/50" />
                        </div>
                        <span className="text-[10px] font-mono text-muted">
                          {patch.file} — ghost patch
                        </span>
                      </div>

                      {/* Diff lines */}
                      <div className="bg-[#080c14] px-0 py-2 font-mono text-xs overflow-x-auto">
                        {patch.lines.map((line: { type: string; content: string }, lineIndex: number) => (
                          <div
                            key={lineIndex}
                            className={`flex items-center px-4 py-0.5 ${
                              line.type === "add"
                                ? "diff-add"
                                : line.type === "remove"
                                ? "diff-remove"
                                : "diff-neutral"
                            }`}
                          >
                            <span className="w-6 text-right text-muted/40 mr-4 select-none flex-shrink-0">
                              {lineIndex + 1}
                            </span>
                            <span className="w-4 flex-shrink-0 select-none">
                              {line.type === "add" ? (
                                <span className="text-ecg-green">+</span>
                              ) : line.type === "remove" ? (
                                <span className="text-critical">-</span>
                              ) : (
                                <span className="text-muted/20"> </span>
                              )}
                            </span>
                            <span
                              className={
                                line.type === "add"
                                  ? "text-ecg-green/90"
                                  : line.type === "remove"
                                  ? "text-critical/70 line-through"
                                  : "text-muted-light"
                              }
                            >
                              {line.content}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action bar */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#080c14] border-t border-border/50">
                        <div className="flex items-center gap-4 text-[10px] font-mono text-muted">
                          <span className="text-ecg-green">
                            +{patch.lines.filter((l: { type: string }) => l.type === "add").length} additions
                          </span>
                          <span className="text-critical">
                            -{patch.lines.filter((l: { type: string }) => l.type === "remove").length} deletions
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const diffText = patch.lines.map((l: any) => (l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ') + l.content).join('\n');
                            navigator.clipboard.writeText(diffText);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ecg-green/10 border border-ecg-green/30 text-ecg-green text-xs font-mono font-semibold hover:bg-ecg-green/20 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Copy Patch
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
