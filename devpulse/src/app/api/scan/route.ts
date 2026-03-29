import { NextRequest, NextResponse } from "next/server";
import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import type { ScanReport } from "./types";

function isGitUrl(input: string): boolean {
  return (
    input.startsWith("https://github.com/") ||
    input.startsWith("http://github.com/") ||
    input.startsWith("git@github.com:") ||
    input.startsWith("https://gitlab.com/") ||
    input.startsWith("https://bitbucket.org/") ||
    (input.includes("github.com") && input.includes("/"))
  );
}

function cloneRepo(url: string): string {
  // Extract repo name from URL
  const parts = url.replace(/\.git$/, "").split("/");
  const repoName = parts[parts.length - 1] || "repo";
  const tmpDir = path.join(os.tmpdir(), "devpulse-scans", `${repoName}-${Date.now()}`);

  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`[DevPulse] Cloning ${url} → ${tmpDir}`);

  // Shallow clone for speed (only need recent history)
  execSync(`git clone --depth 100 "${url}" "${tmpDir}"`, {
    timeout: 120000,
    stdio: "pipe",
  });

  console.log(`[DevPulse] Clone complete: ${tmpDir}`);
  return tmpDir;
}

function runPythonAnalyzer(script: string, repoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const analyzersDir = path.join(process.cwd(), "..", "analyzers");
    const scriptPath = path.join(analyzersDir, script);

    console.log(`[DevPulse] Running: python "${scriptPath}" "${repoPath}"`);

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
  let clonedDir: string | null = null;

  try {
    const body = await request.json();
    let repoPath: string = body.repoPath?.trim();

    if (!repoPath) {
      return NextResponse.json(
        { error: "repoPath is required" },
        { status: 400 }
      );
    }

    // If it's a GitHub/GitLab URL, clone it first
    if (isGitUrl(repoPath)) {
      try {
        clonedDir = cloneRepo(repoPath);
        repoPath = clonedDir;
      } catch (cloneErr) {
        console.error("[DevPulse] Clone failed:", cloneErr);
        return NextResponse.json(
          { error: `Failed to clone repository. Make sure the URL is correct and the repo is public. Details: ${String(cloneErr)}` },
          { status: 400 }
        );
      }
    }

    // Verify the path exists and is a git repo
    if (!fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: `Path does not exist: ${repoPath}` },
        { status: 400 }
      );
    }

    if (!fs.existsSync(path.join(repoPath, ".git"))) {
      return NextResponse.json(
        { error: `Not a git repository: ${repoPath}. Make sure the path has a .git folder.` },
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
      devHoursBreakdown: (scoreResult?.devHoursBreakdown as ScanReport["devHoursBreakdown"]) ?? [],
      flakyClassification: (testResult?.flakyClassification as ScanReport["flakyClassification"]) ?? undefined,
      ciAnalysis: (ghostResult?.ciAnalysis as ScanReport["ciAnalysis"]) ?? undefined,
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
  } finally {
    // Cleanup cloned repo after scan
    if (clonedDir) {
      try {
        fs.rmSync(clonedDir, { recursive: true, force: true });
        console.log(`[DevPulse] Cleaned up: ${clonedDir}`);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
