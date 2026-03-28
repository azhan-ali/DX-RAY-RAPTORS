"use client";

import { Activity } from "lucide-react";
import { repoInfo } from "@/lib/demoData";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 mt-12">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-ecg-green/10 border border-ecg-green/20">
              <Activity className="w-4 h-4 text-ecg-green" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">DevPulse</span>
              <span className="text-xs text-muted ml-2">v1.0</span>
            </div>
          </div>

          {/* Scan Info */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-muted">
            <span>Scanned: {repoInfo.scanDate}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Duration: {repoInfo.scanDuration}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{repoInfo.totalCommits.toLocaleString()} commits analyzed</span>
          </div>

          {/* Tagline */}
          <div className="text-[11px] text-muted">
            Not a dashboard — an <span className="text-ecg-green font-semibold">X-ray</span>.
          </div>
        </div>
      </div>
    </footer>
  );
}
