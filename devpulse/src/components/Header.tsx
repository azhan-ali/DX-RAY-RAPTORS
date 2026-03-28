"use client";

import { Activity, GitBranch, Clock, Users } from "lucide-react";
import { repoInfo } from "@/lib/demoData";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-ecg-green/10 border border-ecg-green/20">
            <Activity className="w-5 h-5 text-ecg-green" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-ecg-green animate-pulse-glow" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">
              DevPulse
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ecg-green/70">
              Repository X-Ray
            </span>
          </div>
        </div>

        {/* ECG Line Animation */}
        <div className="hidden md:block flex-1 max-w-md mx-8 h-8 overflow-hidden opacity-40">
          <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,20 L30,20 L35,20 L40,8 L45,32 L50,5 L55,35 L60,18 L65,22 L70,20 L100,20 L130,20 L135,20 L140,8 L145,32 L150,5 L155,35 L160,18 L165,22 L170,20 L200,20 L230,20 L235,20 L240,8 L245,32 L250,5 L255,35 L260,18 L265,22 L270,20 L300,20 L330,20 L335,20 L340,8 L345,32 L350,5 L355,35 L360,18 L365,22 L370,20 L400,20"
              fill="none"
              stroke="#00ff41"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 1200,
                strokeDashoffset: 1200,
                animation: "ecg-line-draw 3s linear infinite",
              }}
            />
          </svg>
        </div>

        {/* Repo Info */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="text-foreground">{repoInfo.name}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{repoInfo.branch}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{repoInfo.contributors}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{repoInfo.scanDuration}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
