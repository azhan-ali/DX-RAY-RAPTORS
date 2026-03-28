"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FolderGit2, Play, Loader2, AlertTriangle, Eye, Zap, Shield, Brain, ChevronRight, Sparkles, Scan, Radio } from "lucide-react";
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

/* ──────────────────────────────────────────────────────
   Canvas Particle Network Background
   ────────────────────────────────────────────────────── */
function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 65, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (1 - dist / 150) * 0.12;
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const cleanup = draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => {
      cleanup?.();
      window.removeEventListener("resize", handleResize);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />;
}

/* ──────────────────────────────────────────────────────
   Animated ECG Line (full width, prominent)
   ────────────────────────────────────────────────────── */
function ECGLine() {
  return (
    <div className="absolute inset-0 flex items-center pointer-events-none" style={{ zIndex: 2 }}>
      <svg className="w-full" viewBox="0 0 1200 100" preserveAspectRatio="none" style={{ height: "120px" }}>
        <defs>
          <linearGradient id="ecgLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff41" stopOpacity="0" />
            <stop offset="15%" stopColor="#00ff41" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#00ff41" stopOpacity="0.25" />
            <stop offset="85%" stopColor="#00ff41" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
          </linearGradient>
          <filter id="ecgGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0,50 L100,50 L150,50 L170,48 L185,52 L200,50 L280,50 L300,50 L310,45 L320,55 L330,50 L400,50 L430,50 L440,15 L450,85 L458,5 L466,65 L474,40 L485,50 L560,50 L600,50 L650,50 L670,48 L685,52 L700,50 L780,50 L800,50 L810,45 L820,55 L830,50 L900,50 L930,50 L940,15 L950,85 L958,5 L966,65 L974,40 L985,50 L1060,50 L1100,50 L1200,50"
          fill="none"
          stroke="url(#ecgLineGrad)"
          strokeWidth="1.5"
          filter="url(#ecgGlow)"
          strokeDasharray="2400"
          strokeDashoffset="2400"
          style={{ animation: "ecg-line-draw 4s ease-in-out forwards" }}
        />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   SCAN LANDING PAGE
   ────────────────────────────────────────────────────── */
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
    { icon: Zap, label: "5 Dimensions", desc: "CI · Tests · Velocity · Review · Docs" },
    { icon: Brain, label: "AI Ghost Patches", desc: "Gemini-powered code fixes" },
    { icon: Shield, label: "Causal Engine", desc: "Time-lagged correlations" },
    { icon: Sparkles, label: "Time Machine", desc: "30-day forecast" },
  ];

  // Data stream columns for matrix effect (deterministic to avoid hydration mismatch)
  const dataStreams = Array.from({ length: 25 }, (_, i) => {
    const seed = (i * 7 + 3) % 25;
    return {
      left: `${(i / 25) * 100 + (seed % 4)}%`,
      duration: `${3 + (seed % 5)}s`,
      delay: `${(seed * 0.25) % 6}s`,
      height: `${40 + (seed * 3.2)}px`,
    };
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">

      {/* ─── LAYER 1: Canvas Particle Network ─── */}
      <ParticleNetwork />

      {/* ─── LAYER 2: Grid Overlay ─── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" style={{ zIndex: 2 }} />

      {/* ─── LAYER 3: Matrix Data Streams ─── */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
        {dataStreams.map((s, i) => (
          <div
            key={i}
            className="data-stream-col"
            style={{
              left: s.left,
              height: s.height,
              ["--duration" as string]: s.duration,
              ["--delay" as string]: s.delay,
            }}
          />
        ))}
      </div>

      {/* ─── LAYER 4: Horizontal Scan Line ─── */}
      <div className="scan-sweep-line" />

      {/* ─── LAYER 5: Floating Gradient Orbs ─── */}
      <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] rounded-full bg-ecg-green/[0.04] blur-[100px] pointer-events-none orb-float-1" style={{ zIndex: 2 }} />
      <div className="absolute top-[60%] right-[10%] w-[350px] h-[350px] rounded-full bg-accent-cyan/[0.05] blur-[90px] pointer-events-none orb-float-2" style={{ zIndex: 2 }} />
      <div className="absolute bottom-[10%] left-[40%] w-[300px] h-[300px] rounded-full bg-accent-purple/[0.04] blur-[80px] pointer-events-none orb-float-3" style={{ zIndex: 2 }} />

      {/* ─── LAYER 6: ECG Line ─── */}
      <ECGLine />

      {/* ─── LAYER 7: Expanding Pulse Rings ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 2 }}>
        {[0, 1.5, 3].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: 200 + i * 80,
              height: 200 + i * 80,
              borderColor: i === 0 ? "rgba(0,255,65,0.12)" : i === 1 ? "rgba(0,212,255,0.08)" : "rgba(168,85,247,0.06)",
            }}
            animate={{ scale: [1, 3], opacity: [0.3, 0] }}
            transition={{ duration: 5, delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════
           MAIN CONTENT
         ═══════════════════════════════════════════ */}
      <div className="relative flex flex-col items-center justify-center h-screen px-4 py-4" style={{ zIndex: 10 }}>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-ecg-green/5 border border-ecg-green/20 mb-3"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ecg-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ecg-green" />
          </span>
          <span className="text-xs font-mono text-ecg-green/80 uppercase tracking-wider" style={{ animation: "statusFlicker 3s infinite" }}>
            System Online — Ready to Scan
          </span>
        </motion.div>

        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 15 }}
          className="relative mb-3"
        >
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-ecg-green/10 border border-ecg-green/20 neon-border-pulse">
            <Activity className="w-8 h-8 text-ecg-green drop-shadow-[0_0_12px_rgba(0,255,65,0.5)]" />
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-ecg-green/80 animate-pulse-glow" />
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-ecg-green/30 animate-ping" />
          </div>
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-accent-cyan"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ top: -4, left: "50%", transformOrigin: "0 40px" }}
          />
        </motion.div>

        {/* Title with glitch effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-1"
        >
          <h1
            className="text-5xl md:text-6xl font-black tracking-tight glitch-text"
            data-text="DevPulse"
            style={{ textShadow: "0 0 20px rgba(0,255,65,0.3), 0 0 60px rgba(0,255,65,0.1)" }}
          >
            <span className="bg-gradient-to-r from-ecg-green via-accent-cyan to-ecg-green bg-clip-text text-transparent">
              DevPulse
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-ecg-green/50" />
          <p className="text-sm font-mono text-ecg-green/90 uppercase tracking-[0.4em]">Repository X-Ray</p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-ecg-green/50" />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-muted-light max-w-md text-center leading-snug mb-4"
        >
          Expose hidden friction in your codebase. Get an{" "}
          <span className="text-ecg-green font-semibold">ECG-style diagnostic report</span>{" "}
          with AI-powered fixes, causal analysis, and 30-day forecasts.
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-4 gap-2 mb-5 w-full max-w-2xl"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              whileHover={{ y: -4, borderColor: "rgba(0,255,65,0.3)" }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface/40 backdrop-blur-sm border border-border/50 hover:bg-surface/60 transition-all cursor-default group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ecg-green/5 border border-ecg-green/10 group-hover:border-ecg-green/30 group-hover:bg-ecg-green/10 transition-all">
                <f.icon className="w-4 h-4 text-ecg-green/70 group-hover:text-ecg-green transition-colors" />
              </div>
              <span className="text-[11px] font-semibold text-foreground/90">{f.label}</span>
              <span className="text-[9px] text-muted text-center leading-tight">{f.desc}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── SCAN CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
          className="relative w-full max-w-lg"
        >
          {/* Animated border glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-ecg-green/20 via-accent-cyan/20 to-accent-purple/20 blur-sm opacity-60" />

          <div className="relative bg-surface/80 backdrop-blur-xl border border-ecg-green/10 rounded-2xl p-5 space-y-3 neon-border-pulse">
            {/* Top green line */}
            <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-ecg-green/40 to-transparent" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-ecg-green/30 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-ecg-green/30 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-ecg-green/30 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-ecg-green/30 rounded-br-2xl" />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-mono text-ecg-green/70 uppercase tracking-wider">
                <Scan className="w-3.5 h-3.5" />
                Initialize Scan
              </label>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted/60">
                <Radio className="w-3 h-3 text-ecg-green/50" />
                <span>DIAGNOSTIC MODE</span>
              </div>
            </div>

            <div className="relative group">
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="https://github.com/user/repo"
                disabled={isScanning}
                className="w-full bg-background/90 border border-border/60 rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted/30 focus:outline-none focus:border-ecg-green/40 focus:ring-2 focus:ring-ecg-green/10 focus:shadow-[0_0_20px_rgba(0,255,65,0.08)] transition-all disabled:opacity-50"
              />
              {repoPath && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-ecg-green animate-pulse" />
                  <span className="text-[10px] font-mono text-ecg-green/60">READY</span>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/8 rounded-lg px-3 py-2.5 border border-amber-400/15"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error} — loaded demo data instead</span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={!repoPath.trim() || isScanning}
                className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-ecg-green/20 to-ecg-green/10 border border-ecg-green/30 text-ecg-green rounded-xl px-4 py-3 text-sm font-bold hover:from-ecg-green/30 hover:to-ecg-green/15 hover:border-ecg-green/50 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                    <span className="text-[10px] font-mono opacity-60 ml-1">ANALYZING</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Activate X-Ray</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                onClick={loadDemo}
                disabled={isScanning}
                className="flex items-center gap-2 bg-surface/60 border border-border/60 text-muted-light rounded-xl px-5 py-3 text-sm font-medium hover:text-foreground hover:border-ecg-green/20 hover:bg-ecg-green/5 hover:shadow-[0_0_15px_rgba(0,255,65,0.08)] transition-all disabled:opacity-40"
              >
                <Eye className="w-4 h-4" />
                Demo
              </button>
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent" />
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center gap-2 mt-4"
        >
          {/* GitHub + Info */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/azhan-ali/DX-RAY-RAPTORS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface/40 backdrop-blur-sm border border-border/50 text-muted-light text-xs font-medium hover:text-ecg-green hover:border-ecg-green/30 hover:bg-ecg-green/5 transition-all group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>Open Source</span>
              <ChevronRight className="w-3 h-3 opacity-30 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <span className="text-[10px] text-muted/40 font-mono">v0.1.0 • MIT</span>
          </div>

          {/* Tech line */}
          <p className="text-[10px] text-muted/30 font-mono tracking-wide">
            AUTO-CLONE • PYTHON 3.10+ • GEMINI AI • 3-LAYER FALLBACK
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardBackground() {
  const dataStreams = Array.from({ length: 20 }, (_, i) => {
    const seed = (i * 7 + 3) % 20;
    return {
      left: `${(i / 20) * 100 + (seed % 4)}%`,
      duration: `${4 + (seed % 5)}s`,
      delay: `${(seed * 0.3) % 6}s`,
      height: `${40 + (seed * 3)}px`,
    };
  });

  return (
    <>
      {/* Canvas Particle Network */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <ParticleNetwork />
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Matrix Data Streams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {dataStreams.map((s, i) => (
          <div
            key={i}
            className="data-stream-col"
            style={{
              left: s.left,
              height: s.height,
              ["--duration" as string]: s.duration,
              ["--delay" as string]: s.delay,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Scan Sweep Line */}
      <div className="scan-sweep-line" style={{ opacity: 0.5 }} />

      {/* Floating Gradient Orbs */}
      <div className="fixed top-[15%] left-[10%] w-[350px] h-[350px] rounded-full bg-ecg-green/[0.025] blur-[100px] pointer-events-none orb-float-1" style={{ zIndex: 0 }} />
      <div className="fixed top-[50%] right-[5%] w-[300px] h-[300px] rounded-full bg-accent-cyan/[0.03] blur-[90px] pointer-events-none orb-float-2" style={{ zIndex: 0 }} />
      <div className="fixed bottom-[5%] left-[30%] w-[250px] h-[250px] rounded-full bg-accent-purple/[0.025] blur-[80px] pointer-events-none orb-float-3" style={{ zIndex: 0 }} />
    </>
  );
}

function Dashboard() {
  const { isDemo } = useReport();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Animated Background */}
      <DashboardBackground />

      {/* Content Layer */}
      <div className="relative" style={{ zIndex: 1 }}>
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
