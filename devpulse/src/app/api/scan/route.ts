import { NextRequest, NextResponse } from "next/server";
import { analyzeRepository, parseGitHubUrl } from "./analyzers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoUrl: string = body.repoPath?.trim();

    if (!repoUrl) {
      return NextResponse.json({ error: "repoPath is required" }, { status: 400 });
    }

    if (!parseGitHubUrl(repoUrl)) {
      return NextResponse.json(
        { error: "Please provide a valid GitHub repository URL (e.g. https://github.com/user/repo)" },
        { status: 400 }
      );
    }

    console.log(`[DevPulse] Analyzing via GitHub API: ${repoUrl}`);
    const report = await analyzeRepository(repoUrl);
    return NextResponse.json(report);
  } catch (err) {
    console.error("[DevPulse] Scan error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, mode: "demo" },
      { status: 500 }
    );
  }
}
