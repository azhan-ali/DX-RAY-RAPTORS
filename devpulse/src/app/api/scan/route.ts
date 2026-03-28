import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import type { ScanReport } from "./types";

function runPythonAnalyzer(script: string, repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const analyzersDir = path.join(process.cwd(), "..", "analyzers");
    const scriptPath = path.join(analyzersDir, script);

    const proc = spawn("python", [scriptPath, repoPath], {
      cwd: analyzersDir,
      timeout: 60000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`${script} exited with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn ${script}: ${err.message}`));
    });
  });
}

async function runAnalyzerSafe(script: string, repoPath: string): Promise<Record<string, unknown> | null> {
  try {
    const output = await runPythonAnalyzer(script, repoPath);
    return JSON.parse(output);
  } catch (err) {
    console.error(`[DevPulse] ${script} failed:`, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoPath: string = body.repoPath;

    if (!repoPath) {
      return NextResponse.json(
        { error: "repoPath is required" },
        { status: 400 }
      );
    }

    // Run all analyzers in parallel
    const [gitResult, ciResult, testResult, scoreResult, forecastResult, correlationResult, ghostResult] =
      await Promise.all([
        runAnalyzerSafe("git_analyzer.py", repoPath),
        runAnalyzerSafe("ci_parser.py", repoPath),
        runAnalyzerSafe("test_analyzer.py", repoPath),
        runAnalyzerSafe("score_engine.py", repoPath),
        runAnalyzerSafe("forecaster.py", repoPath),
        runAnalyzerSafe("correlation.py", repoPath),
        runAnalyzerSafe("ghost.py", repoPath),
      ]);

    // If all analyzers failed, return error
    if (!gitResult && !ciResult && !testResult && !scoreResult) {
      return NextResponse.json(
        { error: "All analyzers failed. Check Python installation and repo path.", mode: "demo" },
        { status: 500 }
      );
    }

    const report: ScanReport = {
      repoInfo: (gitResult?.repoInfo as ScanReport["repoInfo"]) ?? {
        name: path.basename(repoPath),
        branch: "main",
        contributors: 0,
        lastCommit: "unknown",
        scanDuration: "N/A",
        totalCommits: 0,
      },
      overallScore: (scoreResult?.overallScore as number) ?? 0,
      previousOverallScore: (scoreResult?.previousOverallScore as number) ?? 0,
      dimensions: (scoreResult?.dimensions as ScanReport["dimensions"]) ?? [],
      causalLinks: (correlationResult?.causalLinks as ScanReport["causalLinks"]) ?? [],
      forecast: (forecastResult?.forecast as ScanReport["forecast"]) ?? [],
      ghostPatches: (ghostResult?.patches as ScanReport["ghostPatches"]) ?? [],
      recommendations: (scoreResult?.recommendations as ScanReport["recommendations"]) ?? [],
      anomalyEvents: (scoreResult?.anomalyEvents as ScanReport["anomalyEvents"]) ?? [],
      beforeAfter: (scoreResult?.beforeAfter as ScanReport["beforeAfter"]) ?? [],
      devHoursWasted: (scoreResult?.devHoursWasted as number) ?? 0,
      scanTimestamp: new Date().toISOString(),
      mode: "live",
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error("[DevPulse] Scan error:", err);
    return NextResponse.json(
      { error: "Internal scan error", details: String(err) },
      { status: 500 }
    );
  }
}
