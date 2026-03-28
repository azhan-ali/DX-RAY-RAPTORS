"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FolderGit2, Play, Loader2, AlertTriangle, Eye, Zap, Shield, Brain, ChevronRight, Sparkles } from "lucide-react";
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

function ECGBackgroundLine() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setOffset((p) => (p + 1) % 200), 30);
    return () => clearInterval(interval);
  }, []);

  const ecgPath = "M0,50 L20,50 L25,50 L30,42 L35,58 L40,50 L60,50 L65,50 L68,20 L71,80 L74,10 L77,60 L80,45 L85,50 L100,50 L120,50 L125,50 L130,42 L135,58 L140,50 L160,50 L165,50 L168,20 L171,80 L174,10 L177,60 L180,45 L185,50 L200,50";

  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0" />
          <stop offset="30%" stopColor="#00ff41" stopOpacity="1" />
          <stop offset="70%" stopColor="#00ff41" stopOpacity="1" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.15, 0.35, 0.55, 0.75].map((y, i) => (
        <g key={i} style={{ transform: `translateX(-${offset + i * 50}px)` }}>
          <path
            d={ecgPath}
            fill="none"
            stroke="url(#ecgGrad)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{
              transform: `translateY(${y * 100}%)`,
              transformOrigin: "center",
            }}
          />
        </g>
      ))}
    </svg>
  );
}

function FloatingParticle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-ecg-green/30"
      initial={{ opacity: 0, y: "100vh", x: `${x}vw` }}
      animate={{
        opacity: [0, 0.6, 0],
        y: [100, -20],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{ left: `${x}%` }}
    />
  );
}

function ScanLanding() {
  const { startScan, loadDemo, scanState, error } = useReport();
  const [repoPath, setRepoPath] = useState("");
  const isScanning = scanState === "scanning";

  const handleScan = () => {
    if (repoPath.trim()) {
      startScan(repoPath.trim());
    }
  };

  const features = [
    { icon: Zap, label: "5 Dimensions", color: "text-ecg-green" },
    { icon: Brain, label: "AI Patches", color: "text-accent-cyan" },
    { icon: Shield, label: "Causal Engine", color: "text-accent-purple" },
    { icon: Sparkles, label: "Time Machine", color: "text-warning" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden">

      {/* Animated ECG Background */}
      <ECGBackgroundLine />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60" />

      {/* Radial glow - center green */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-ecg-green/[0.03] blur-[120px] pointer-events-none" />

      {/* Radial glow - top right cyan */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent-cyan/[0.04] blur-[100px] pointer-events-none" />

      {/* Radial glow - bottom left purple */}
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent-purple/[0.03] blur-[100px] pointer-events-none" />

      {/* Floating particles */}
      {[5, 15, 25, 35, 48, 55, 65, 75, 85, 92].map((x, i) => (
        <FloatingParticle key={i} x={x} delay={i * 1.2} duration={6 + (i % 3) * 2} />
      ))}

      {/* Scanning pulse ring effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <motion.div
          className="w-[300px] h-[300px] rounded-full border border-ecg-green/10"
          animate={{ scale: [1, 2.5], opacity: [0.15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 w-[300px] h-[300px] rounded-full border border-accent-cyan/10"
          animate={{ scale: [1, 2], opacity: [0.1, 0] }}
          transition={{ duration: 4, delay: 2, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-xl w-full mx-4"
      >
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-ecg-green/10 border border-ecg-green/20 mb-5 glow-green"
          >
            <Activity className="w-10 h-10 text-ecg-green" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ecg-green animate-pulse-glow" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ecg-green/40 animate-ping" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold tracking-tight text-foreground text-glow-green"
          >
            DevPulse
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm font-mono text-ecg-green/80 uppercase tracking-[0.3em] mt-2"
          >
            Repository X-Ray
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-muted-light mt-4 text-center max-w-md leading-relaxed"
          >
            Scan any Git repository to get an <span className="text-ecg-green font-medium">ECG-style health report</span> across
            5 critical developer experience dimensions.
          </motion.p>
        </div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mb-8 flex-wrap"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/80 border border-border text-xs font-medium"
            >
              <f.icon className={`w-3 h-3 ${f.color}`} />
              <span className="text-muted-light">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative bg-surface/70 backdrop-blur-xl border border-border rounded-2xl p-6 space-y-4 glow-green"
          style={{ boxShadow: "0 0 40px rgba(0, 255, 65, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)" }}
        >
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-ecg-green/30 to-transparent" />

          <label className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
            <FolderGit2 className="w-3.5 h-3.5 text-ecg-green/60" />
            Repository Path or GitHub URL
          </label>

          <div className="relative">
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="https://github.com/user/repo"
              disabled={isScanning}
              className="w-full bg-background/80 border border-border rounded-xl px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-ecg-green/50 focus:ring-2 focus:ring-ecg-green/10 transition-all disabled:opacity-50"
            />
            {repoPath && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ecg-green/60"
              />
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 border border-amber-400/20"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error} — loaded demo data instead</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleScan}
              disabled={!repoPath.trim() || isScanning}
              className="flex-1 flex items-center justify-center gap-2 bg-ecg-green/15 border border-ecg-green/30 text-ecg-green rounded-xl px-4 py-3.5 text-sm font-semibold hover:bg-ecg-green/25 hover:border-ecg-green/50 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Repository...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Scan Repository
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <button
              onClick={loadDemo}
              disabled={isScanning}
              className="flex items-center gap-2 bg-surface border border-border text-muted-light rounded-xl px-5 py-3.5 text-sm font-medium hover:text-foreground hover:border-ecg-green/20 hover:bg-ecg-green/5 transition-all disabled:opacity-40"
            >
              <Eye className="w-4 h-4" />
              Demo
            </button>
          </div>
        </motion.div>

        {/* Bottom links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-4 mt-6"
        >
          <a
            href="https://github.com/azhan-ali/DX-RAY-RAPTORS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface/50 border border-border text-muted-light text-xs font-medium hover:text-foreground hover:border-ecg-green/30 hover:bg-ecg-green/5 transition-all group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <span>Open Source</span>
            <ChevronRight className="w-3 h-3 opacity-40 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <span className="text-[11px] text-muted/50 font-mono">
            v0.1.0 • MIT License
          </span>
        </motion.div>

        {/* Tech hint */}
        <p className="text-[10px] text-muted/40 text-center mt-3 font-mono">
          GitHub URLs auto-cloned • Python 3.10+ • Git • Gemini AI (optional)
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
