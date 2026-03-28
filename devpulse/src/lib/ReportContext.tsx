"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as demo from "@/lib/demoData";

type ScanState = "idle" | "scanning" | "loaded" | "error";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ScanReport {
  repoInfo: any;
  overallScore: number;
  previousOverallScore: number;
  dimensions: any[];
  causalLinks: any[];
  forecast: any[];
  ghostPatches: any[];
  recommendations: any[];
  anomalyEvents: any[];
  beforeAfter: any[];
  devHoursWasted: any;
  scanTimestamp: string;
  mode: "live" | "demo";
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ReportContextValue {
  report: ScanReport | null;
  scanState: ScanState;
  error: string | null;
  isDemo: boolean;
  startScan: (repoPath: string) => Promise<void>;
  loadDemo: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

function buildDemoReport(): ScanReport {
  return {
    repoInfo: demo.repoInfo,
    overallScore: demo.overallScore,
    previousOverallScore: demo.previousOverallScore,
    dimensions: demo.dimensions,
    causalLinks: demo.causalLinks,
    forecast: demo.forecastData,
    ghostPatches: demo.ghostPatches,
    recommendations: demo.recommendations,
    anomalyEvents: demo.anomalyEvents,
    beforeAfter: [
      { label: "DX Score", before: "38", after: "41", improvement: "+8%", icon: "TrendingUp", color: "#22c55e" },
      { label: "Build Time", before: "18.4 min", after: "6.1 min", improvement: "-67%", icon: "Clock", color: "#00d4ff" },
      { label: "Flaky Tests", before: "23/week", after: "0/week", improvement: "-100%", icon: "FlaskConical", color: "#a855f7" },
      { label: "Time-to-Review", before: "26 hrs", after: "8 hrs", improvement: "-69%", icon: "Zap", color: "#a855f7" },
    ],
    devHoursWasted: demo.devHoursWasted,
    scanTimestamp: new Date().toISOString(),
    mode: "demo",
  };
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const loadDemo = useCallback(() => {
    setReport(buildDemoReport());
    setScanState("loaded");
    setIsDemo(true);
    setError(null);
  }, []);

  const startScan = useCallback(async (repoPath: string) => {
    setScanState("scanning");
    setError(null);
    setIsDemo(false);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: ScanReport = await res.json();
      data.mode = "live";
      setReport(data);
      setScanState("loaded");
    } catch (err) {
      console.error("[DevPulse] Scan failed, falling back to demo:", err);
      setError(String(err instanceof Error ? err.message : err));
      // 3-layer fallback: API failed → load demo data
      setReport(buildDemoReport());
      setScanState("loaded");
      setIsDemo(true);
    }
  }, []);

  return (
    <ReportContext.Provider value={{ report, scanState, error, isDemo, startScan, loadDemo }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport must be used within ReportProvider");
  return ctx;
}
