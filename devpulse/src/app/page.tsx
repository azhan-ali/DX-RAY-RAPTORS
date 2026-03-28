"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FolderGit2, Play, Loader2, AlertTriangle, Eye } from "lucide-react";
import { ReportProvider, useReport } from "@/lib/ReportContext";
import Header from "@/components/Header";
import HeroScore from "@/components/HeroScore";
import VitalSigns from "@/components/VitalSigns";
import ECGSparklines from "@/components/ECGSparklines";
import CausalChain from "@/components/CausalChain";
import TimeMachine from "@/components/TimeMachine";
import DXGhost from "@/components/DXGhost";
import Recommendations from "@/components/Recommendations";
import BeforeAfter from "@/components/BeforeAfter";
import Footer from "@/components/Footer";

function ScanLanding() {
  const { startScan, loadDemo, scanState, error } = useReport();
  const [repoPath, setRepoPath] = useState("");
  const isScanning = scanState === "scanning";

  const handleScan = () => {
    if (repoPath.trim()) {
      startScan(repoPath.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full mx-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-ecg-green/10 border border-ecg-green/20 mb-4">
            <Activity className="w-8 h-8 text-ecg-green" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-ecg-green animate-pulse-glow" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">DevPulse</h1>
          <p className="text-sm font-mono text-ecg-green/70 uppercase tracking-widest mt-1">Repository X-Ray</p>
          <p className="text-sm text-muted mt-4 text-center max-w-sm">
            Scan any Git repository to get an ECG-style health report across 5 dimensions.
          </p>
        </div>

        {/* Scan Input */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <label className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
            <FolderGit2 className="w-3.5 h-3.5" />
            Repository Path
          </label>
          <input
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="C:\path\to\your\repo"
            disabled={isScanning}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted/50 focus:outline-none focus:border-ecg-green/50 focus:ring-1 focus:ring-ecg-green/20 transition-colors disabled:opacity-50"
          />

          {error && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>API unavailable — loaded demo data instead</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleScan}
              disabled={!repoPath.trim() || isScanning}
              className="flex-1 flex items-center justify-center gap-2 bg-ecg-green/10 border border-ecg-green/30 text-ecg-green rounded-xl px-4 py-3 text-sm font-semibold hover:bg-ecg-green/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Scan Repository
                </>
              )}
            </button>

            <button
              onClick={loadDemo}
              disabled={isScanning}
              className="flex items-center gap-2 bg-surface border border-border text-muted rounded-xl px-4 py-3 text-sm font-medium hover:text-foreground hover:border-border/80 transition-colors disabled:opacity-40"
            >
              <Eye className="w-4 h-4" />
              Demo
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-[11px] text-muted/60 text-center mt-4 font-mono">
          Requires Python 3.10+ installed locally • Git repo with .git directory
        </p>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { isDemo } = useReport();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Demo Mode Badge */}
      {isDemo && (
        <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Demo Mode — facebook/react
          </div>
        </div>
      )}

      <main>
        <HeroScore />
        <VitalSigns />
        <ECGSparklines />
        <CausalChain />
        <TimeMachine />
        <DXGhost />
        <Recommendations />
        <BeforeAfter />
      </main>
      <Footer />
    </div>
  );
}

function AppContent() {
  const { scanState } = useReport();

  return (
    <AnimatePresence mode="wait">
      {scanState === "loaded" ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Dashboard />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ScanLanding />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <ReportProvider>
      <AppContent />
    </ReportProvider>
  );
}
