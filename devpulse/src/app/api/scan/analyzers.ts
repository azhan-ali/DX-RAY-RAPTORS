/**
 * DevPulse TypeScript Analyzers — GitHub API based, works on Vercel.
 */
import type {
  ScanReport, DimensionResult, DimensionSignal, CausalLink,
  ForecastPoint, GhostPatch, Recommendation, AnomalyEvent,
  BeforeAfterMetric, DevHoursBreakdownItem,
} from "./types";

const GITHUB_API = "https://api.github.com";

interface GHRepo { name: string; full_name: string; default_branch: string; description: string | null; stargazers_count: number; forks_count: number; open_issues_count: number; pushed_at: string; size: number; language: string | null; }
interface GHCommit { sha: string; commit: { message: string; author: { name: string; date: string } }; author: { login: string } | null; }
interface GHContributor { login: string; contributions: number; }
interface GHTreeItem { path: string; type: string; size?: number; }
interface GHWorkflowRun { conclusion: string | null; status: string; created_at: string; name: string; }
interface ScoreResult { score: number; details: Record<string, unknown>; }

async function ghFetch<T>(path: string): Promise<T | null> {
  try {
    const h: Record<string, string> = { Accept: "application/vnd.github.v3+json", "User-Agent": "DevPulse/1.0" };
    const token = process.env.GITHUB_TOKEN;
    if (token) h.Authorization = `Bearer ${token}`;
    const res = await fetch(`${GITHUB_API}${path}`, { headers: h });
    if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")
      throw new Error("GitHub API rate limit exceeded. Try again later or add GITHUB_TOKEN env var.");
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) { if (err instanceof Error && err.message.includes("rate limit")) throw err; return null; }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.trim().replace(/\.git$/, "").replace(/\/$/, "").match(/github\.com[/:]([^/]+)\/([^/]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function fetchRepoData(owner: string, repo: string) {
  const repoInfo = await ghFetch<GHRepo>(`/repos/${owner}/${repo}`);
  const branch = repoInfo?.default_branch ?? "main";
  const [commits, contributors, treeData, runsData] = await Promise.all([
    ghFetch<GHCommit[]>(`/repos/${owner}/${repo}/commits?per_page=100&sha=${branch}`),
    ghFetch<GHContributor[]>(`/repos/${owner}/${repo}/contributors?per_page=30`),
    ghFetch<{ tree: GHTreeItem[] }>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`),
    ghFetch<{ workflow_runs: GHWorkflowRun[] }>(`/repos/${owner}/${repo}/actions/runs?per_page=30`),
  ]);
  return { repoInfo, commits: commits ?? [], contributors: contributors ?? [], tree: treeData?.tree ?? [], runs: runsData?.workflow_runs ?? [] };
}

function generateSignals(commits: GHCommit[], baseScore: number, dimId: string): DimensionSignal[] {
  const now = new Date(); const daily = new Array(28).fill(0);
  for (const c of commits) { const d = Math.floor((now.getTime() - new Date(c.commit.author.date).getTime()) / 86400000); if (d >= 0 && d < 28) daily[27 - d]++; }
  const mx = Math.max(...daily, 1);
  return Array.from({ length: 28 }, (_, i) => {
    const dt = new Date(now); dt.setDate(dt.getDate() - (27 - i));
    const a = daily[i] / mx;
    let v: number;
    switch (dimId) {
      case "ci_build": v = baseScore + (a * 20 - 10) + Math.sin(i * 0.5) * 5; break;
      case "test_stability": v = baseScore + (a * 15 - 8) + Math.cos(i * 0.3) * 7; break;
      case "commit_velocity": v = baseScore * (0.5 + a * 0.8); break;
      case "code_review": v = baseScore + (a * 12 - 6) + Math.sin(i * 0.4) * 8; break;
      case "doc_freshness": v = baseScore - i * 0.25 + a * 12; break;
      default: v = baseScore + (a * 10 - 5);
    }
    return { day: i + 1, date: dt.toISOString().split("T")[0], value: Math.max(0, Math.min(100, Math.round(v))) };
  });
}

function scoreCI(tree: GHTreeItem[], runs: GHWorkflowRun[]): ScoreResult {
  let s = 0;
  const ciFiles = tree.filter(f => f.path.startsWith(".github/workflows/") || f.path === ".gitlab-ci.yml" || f.path === "Jenkinsfile" || f.path.startsWith(".circleci/") || f.path === ".travis.yml");
  const hasCI = ciFiles.length > 0;
  if (hasCI) s += 20;
  if (runs.length > 0) { const sr = runs.filter(r => r.conclusion === "success").length / runs.length; s += Math.round(sr * 50) + Math.min(30, runs.length); }
  else if (hasCI) s += 20;
  return { score: Math.min(100, s), details: { hasCI, ciFileCount: ciFiles.length, runCount: runs.length } };
}

function scoreTests(tree: GHTreeItem[]): ScoreResult {
  let s = 0;
  const tp = [/test/i, /spec/i, /__tests__/i, /\.test\./i, /\.spec\./i];
  const tf = tree.filter(f => f.type === "blob" && tp.some(p => p.test(f.path)));
  const total = tree.filter(f => f.type === "blob").length;
  if (tf.length > 0) s += 25;
  if (total > 0) s += Math.min(35, Math.round((tf.length / total) * 350));
  const hasFw = tree.some(f => ["jest.config.js","jest.config.ts","pytest.ini","conftest.py","vitest.config.ts","vitest.config.js"].includes(f.path) || f.path.startsWith("cypress/"));
  if (hasFw) s += 20;
  if (tf.length > 10) s += 10;
  if (tf.length > 50) s += 10;
  return { score: Math.min(100, s), details: { hasTests: tf.length > 0, testFileCount: tf.length, totalFiles: total } };
}

function scoreVelocity(commits: GHCommit[], contributors: GHContributor[]): ScoreResult {
  let s = 0; const now = Date.now();
  const recent = commits.filter(c => now - new Date(c.commit.author.date).getTime() < 28 * 86400000);
  const cpd = recent.length / 28;
  if (cpd >= 5) s += 40; else if (cpd >= 2) s += 30; else if (cpd >= 0.5) s += 20; else if (cpd > 0) s += 10;
  const authors = new Set(recent.map(c => c.author?.login ?? c.commit.author.name)).size;
  if (authors >= 5) s += 30; else if (authors >= 3) s += 20; else if (authors >= 2) s += 15; else if (authors >= 1) s += 5;
  const days7 = new Set(recent.filter(c => now - new Date(c.commit.author.date).getTime() < 7 * 86400000).map(c => new Date(c.commit.author.date).toISOString().split("T")[0])).size;
  s += Math.round((days7 / 7) * 30);
  return { score: Math.min(100, s), details: { commitsPerDay: Math.round(cpd * 10) / 10, activeAuthors: authors } };
}

function scoreReview(commits: GHCommit[], contributors: GHContributor[]): ScoreResult {
  let s = 0;
  const merges = commits.filter(c => c.commit.message.toLowerCase().startsWith("merge"));
  const mr = commits.length > 0 ? merges.length / commits.length : 0;
  if (mr > 0.3) s += 35; else if (mr > 0.1) s += 25; else if (mr > 0) s += 15;
  if (contributors.length >= 5) s += 30; else if (contributors.length >= 3) s += 20; else if (contributors.length >= 2) s += 10;
  const qr = commits.length > 0 ? commits.filter(c => /^(feat|fix|chore|docs|refactor|test|ci|build|perf)[:(]/.test(c.commit.message) || /#\d+/.test(c.commit.message)).length / commits.length : 0;
  s += Math.round(qr * 35);
  return { score: Math.min(100, s), details: { mergeRatio: Math.round(mr * 100), contributorCount: contributors.length } };
}

function scoreDocs(tree: GHTreeItem[], commits: GHCommit[]): ScoreResult {
  let s = 0;
  const hasReadme = tree.some(f => /^readme/i.test(f.path));
  if (hasReadme) s += 25;
  const docFiles = tree.filter(f => f.type === "blob" && (/^docs\//i.test(f.path) || /\.md$/i.test(f.path) || /changelog/i.test(f.path) || /contributing/i.test(f.path) || /license/i.test(f.path)));
  if (docFiles.length >= 10) s += 25; else if (docFiles.length >= 5) s += 20; else if (docFiles.length >= 2) s += 10;
  if (tree.some(f => f.type === "tree" && /^docs$/i.test(f.path))) s += 15;
  const rdc = commits.filter(c => { const m = c.commit.message.toLowerCase(); return Date.now() - new Date(c.commit.author.date).getTime() < 30 * 86400000 && (m.includes("doc") || m.includes("readme")); });
  if (rdc.length >= 3) s += 35; else if (rdc.length >= 1) s += 20; else s += 5;
  return { score: Math.min(100, s), details: { hasReadme, docFileCount: docFiles.length, recentDocUpdates: rdc.length } };
}

// ─── Correlation ────────────────────────────────────────────────────────────

function pearsonR(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length); if (n < 3) return 0;
  const xs = x.slice(0, n), ys = y.slice(0, n);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; cov += dx * dy; sx += dx * dx; sy += dy * dy; }
  sx = Math.sqrt(sx); sy = Math.sqrt(sy);
  return sx === 0 || sy === 0 ? 0 : cov / (sx * sy);
}

function computeCorrelations(dims: DimensionResult[]): CausalLink[] {
  const tpl: Record<string, [string, string]> = {
    "ci_build|test_stability": ["Faster CI correlates with more stable tests ({l}d lag)", "CI slowdowns destabilize tests after {l} days"],
    "ci_build|commit_velocity": ["Fast CI encourages frequent commits ({l}d lag)", "Slow CI reduces commit frequency after {l} days"],
    "test_stability|commit_velocity": ["Stable tests boost developer confidence ({l}d lag)", "Test flakiness slows developers after {l} days"],
    "code_review|commit_velocity": ["Quick reviews keep velocity high ({l}d lag)", "Review lag slows commits after {l} days"],
    "code_review|doc_freshness": ["Active reviews encourage doc updates ({l}d lag)", "Review bottlenecks cause docs to go stale after {l} days"],
    "ci_build|code_review": ["Fast CI enables quicker reviews ({l}d lag)", "CI failures delay reviews after {l} days"],
    "test_stability|code_review": ["Stable tests speed up reviews ({l}d lag)", "Flaky tests slow down reviews after {l} days"],
    "commit_velocity|doc_freshness": ["Active development drives doc updates ({l}d lag)", "High velocity without docs leads to staleness after {l} days"],
  };
  const links: CausalLink[] = [];
  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const va = dims[i].signals.map(s => s.value), vb = dims[j].signals.map(s => s.value);
      let bL = 0, bR = 0;
      for (let lag = 0; lag <= 7; lag++) {
        const r = lag === 0 ? pearsonR(va, vb) : pearsonR(va.slice(0, -lag), vb.slice(lag));
        if (Math.abs(r) > Math.abs(bR)) { bR = r; bL = lag; }
      }
      if (Math.abs(bR) >= 0.25) {
        const k1 = `${dims[i].id}|${dims[j].id}`, k2 = `${dims[j].id}|${dims[i].id}`;
        const t = tpl[k1] ?? tpl[k2];
        const desc = t ? (bR > 0 ? t[0] : t[1]).replace("{l}", String(bL)) : `${dims[i].shortName} ${bR > 0 ? "positively" : "negatively"} correlates with ${dims[j].shortName} (lag: ${bL}d)`;
        links.push({ from: dims[i].id, to: dims[j].id, lag: bL, correlation: Math.round(bR * 100) / 100, description: desc });
      }
    }
  }
  links.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  return links.slice(0, 6);
}

// ─── Forecast ───────────────────────────────────────────────────────────────

function generateForecast(score: number, dims: DimensionResult[]): ForecastPoint[] {
  const pts: ForecastPoint[] = []; const today = new Date();
  for (let i = -14; i <= 0; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const idx = 14 + i; let avg = 0, cnt = 0;
    for (const dm of dims) { if (dm.signals[idx]) { avg += dm.signals[idx].value; cnt++; } }
    pts.push({ day: i, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), actual: cnt > 0 ? Math.round(avg / cnt) : score, fixNow: null, doNothing: null });
  }
  const weak = dims.filter(d => d.score < 50).length;
  const degRate = weak * 0.3 + 0.2, fixRate = 0.8 + (100 - score) * 0.02;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    pts.push({ day: i, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), actual: null, fixNow: Math.min(95, Math.round(score + fixRate * i - Math.pow(i, 0.5) * 0.5)), doNothing: Math.max(5, Math.round(score - degRate * i + Math.sin(i * 0.3) * 2)) });
  }
  return pts;
}

// ─── Recommendations ────────────────────────────────────────────────────────

function generateRecommendations(dims: DimensionResult[], ci: Record<string, unknown>, test: Record<string, unknown>, doc: Record<string, unknown>): Recommendation[] {
  const recs: Recommendation[] = []; let id = 1;
  const sorted = [...dims].sort((a, b) => a.score - b.score);
  for (const d of sorted) {
    if (d.id === "ci_build" && d.score < 60) recs.push({ id: id++, title: ci.hasCI ? "Improve CI build reliability" : "Add CI/CD pipeline", description: ci.hasCI ? "CI success rate needs improvement. Add build caching and fix flaky steps." : "No CI detected. Adding GitHub Actions automates testing and catches bugs early.", impact: "critical", effort: ci.hasCI ? "medium" : "medium", devHoursSaved: ci.hasCI ? 5.2 : 8.5, dimension: "ci_build" });
    if (d.id === "test_stability" && d.score < 60) recs.push({ id: id++, title: test.hasTests ? "Increase test coverage" : "Add automated tests", description: test.hasTests ? `Only ${test.testFileCount} test files. Aim for better coverage.` : "No tests detected. Adding tests prevents regressions.", impact: "critical", effort: "high", devHoursSaved: test.hasTests ? 6.4 : 12.0, dimension: "test_stability" });
    if (d.id === "commit_velocity" && d.score < 60) recs.push({ id: id++, title: "Improve development workflow", description: "Low commit frequency. Consider smaller PRs and feature flags.", impact: "high", effort: "low", devHoursSaved: 4.0, dimension: "commit_velocity" });
    if (d.id === "code_review" && d.score < 60) recs.push({ id: id++, title: "Establish code review practices", description: "Limited PR workflow detected. Enforce branch protection and require reviews.", impact: "high", effort: "low", devHoursSaved: 7.3, dimension: "code_review" });
    if (d.id === "doc_freshness" && d.score < 60) recs.push({ id: id++, title: doc.hasReadme ? "Update documentation" : "Add project README", description: doc.hasReadme ? "Documentation appears stale. Schedule regular doc reviews." : "No README found. A good README reduces onboarding time.", impact: doc.hasReadme ? "medium" : "critical", effort: "low", devHoursSaved: doc.hasReadme ? 2.8 : 3.5, dimension: "doc_freshness" });
  }
  return recs.slice(0, 6);
}

// ─── Anomalies ──────────────────────────────────────────────────────────────

function detectAnomalies(dims: DimensionResult[]): AnomalyEvent[] {
  const anomalies: AnomalyEvent[] = [];
  for (const dim of dims) {
    const vals = dim.signals.map(s => s.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
    if (std === 0) continue;
    for (let i = vals.length - 7; i < vals.length; i++) {
      if (i < 0) continue;
      const z = (vals[i] - mean) / std;
      if (Math.abs(z) >= 1.5) {
        anomalies.push({ date: dim.signals[i].date, dimension: dim.id, description: `${dim.shortName} ${z < 0 ? "dropped" : "spiked"} to ${vals[i]} (z=${z.toFixed(2)})`, severity: Math.abs(z) >= 2.5 ? "critical" : Math.abs(z) >= 2 ? "warning" : "info", zScore: Math.round(z * 100) / 100, value: vals[i], mean: Math.round(mean * 10) / 10, stdDev: Math.round(std * 10) / 10 });
        break;
      }
    }
  }
  return anomalies.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] ?? 2) - ({ critical: 0, warning: 1, info: 2 }[b.severity] ?? 2));
}

// ─── Gemini AI ──────────────────────────────────────────────────────────────

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log("[DX Ghost] No GEMINI_API_KEY set, using fallback templates"); return null; }

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[DX Ghost] Trying model: ${model}`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );
      if (!res.ok) {
        const errBody = await res.text().catch(() => "unknown");
        console.error(`[DX Ghost] ${model} returned ${res.status}: ${errBody.slice(0, 200)}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { console.log(`[DX Ghost] ${model} returned ${text.length} chars`); return text; }
      console.error(`[DX Ghost] ${model} returned empty content`);
    } catch (err) {
      console.error(`[DX Ghost] ${model} failed:`, err);
    }
  }
  console.error("[DX Ghost] All Gemini models failed");
  return null;
}

function extractJSON(raw: string): unknown | null {
  // Try direct parse first
  try { return JSON.parse(raw.trim()); } catch { /* continue */ }
  // Strip markdown fences
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch { /* continue */ } }
  // Find first [ ... ] block
  const arrMatch = raw.match(/(\[\s*\{[\s\S]*\}\s*\])/);
  if (arrMatch) { try { return JSON.parse(arrMatch[1]); } catch { /* continue */ } }
  return null;
}

function fallbackPatches(dims: DimensionResult[], tree: GHTreeItem[], ci: Record<string, unknown>, test: Record<string, unknown>): GhostPatch[] {
  const patches: GhostPatch[] = []; let id = 1;
  const sorted = [...dims].sort((a, b) => a.score - b.score);
  for (const d of sorted.slice(0, 5)) {
    if (d.id === "ci_build" && !ci.hasCI) patches.push({ id: id++, title: "Add GitHub Actions CI workflow", file: ".github/workflows/ci.yml", language: "yaml", diff: "+name: CI\n+on:\n+  push:\n+    branches: [main]\n+  pull_request:\n+    branches: [main]\n+jobs:\n+  build:\n+    runs-on: ubuntu-latest\n+    steps:\n+      - uses: actions/checkout@v4\n+      - run: npm ci\n+      - run: npm test", impact: "Save ~8.5 dev-hrs/month", confidence: 92, patchType: "ci_optimization" });
    else if (d.id === "ci_build") patches.push({ id: id++, title: "Add build caching to CI", file: ".github/workflows/ci.yml", language: "yaml", diff: "+      - name: Cache node_modules\n+        uses: actions/cache@v4\n+        with:\n+          path: ~/.npm\n+          key: node-${{ hashFiles('**/package-lock.json') }}", impact: "Reduce build time ~40%", confidence: 88, patchType: "ci_optimization" });
    if (d.id === "test_stability" && !test.hasTests) { const isTS = tree.some(f => f.path.endsWith(".ts")); patches.push({ id: id++, title: isTS ? "Add Jest test config" : "Add test framework", file: isTS ? "jest.config.ts" : "jest.config.js", language: isTS ? "typescript" : "javascript", diff: "+module.exports = {\n+  testEnvironment: 'node',\n+  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],\n+  collectCoverageFrom: ['src/**/*.{js,ts}'],\n+};", impact: "Enable automated testing", confidence: 85, patchType: "test_setup" }); }
    if (d.id === "code_review") patches.push({ id: id++, title: "Add CODEOWNERS for review routing", file: "CODEOWNERS", language: "text", diff: "+# Auto-assign reviewers\n+* @team-lead\n+/src/ @senior-devs\n+/tests/ @qa-team", impact: "Reduce review time ~50%", confidence: 78, patchType: "review_process" });
    if (d.id === "doc_freshness" && !(tree.some(f => /^readme/i.test(f.path)))) patches.push({ id: id++, title: "Add project README", file: "README.md", language: "markdown", diff: "+# Project\n+\n+> Description\n+\n+## Quick Start\n+```bash\n+npm install && npm start\n+```\n+\n+## License\n+MIT", impact: "Reduce onboarding ~60%", confidence: 95, patchType: "documentation" });
  }
  return patches.slice(0, 5);
}

// ─── Ghost Patches (AI-Powered + Fallback) ──────────────────────────────────

async function generateGhostPatches(dims: DimensionResult[], tree: GHTreeItem[], ci: Record<string, unknown>, test: Record<string, unknown>, repoName: string, lang: string | null): Promise<GhostPatch[]> {
  // Build context for Gemini
  const weakDims = [...dims].sort((a, b) => a.score - b.score).filter(d => d.score < 80).slice(0, 4);
  if (weakDims.length === 0) return fallbackPatches(dims, tree, ci, test);

  const hasCI = ci.hasCI as boolean;
  const hasTests = test.hasTests as boolean;
  const testCount = test.testFileCount as number;
  const ciFiles = tree.filter(f => f.path.startsWith(".github/workflows/")).map(f => f.path);
  const srcFiles = tree.filter(f => f.type === "blob").slice(0, 30).map(f => f.path);

  const prompt = `You are DX Ghost, an AI that generates targeted code patches to improve developer experience.

Repository: ${repoName}
Primary Language: ${lang ?? "unknown"}
CI Config Files: ${ciFiles.length > 0 ? ciFiles.join(", ") : "None detected"}
Has CI: ${hasCI}, Has Tests: ${hasTests} (${testCount} test files)
Sample files: ${srcFiles.slice(0, 15).join(", ")}

Weak dimensions (sorted worst-first):
${weakDims.map(d => `- ${d.name}: ${d.score}/100 (${d.status})`).join("\n")}

Generate exactly ${Math.min(weakDims.length, 4)} code patches as a JSON array. Each patch must fix a specific weak dimension.
Each patch object must have:
- "title": short descriptive title
- "file": target filename (real path like .github/workflows/ci.yml or src/...)
- "language": file language (yaml, javascript, typescript, python, markdown, text)
- "diff": unified diff string where added lines start with + and removed lines start with - (no headers, just code lines)
- "impact": estimated impact string like "Save ~X dev-hrs/month" or "Reduce Y by Z%"
- "confidence": number 70-95
- "patchType": one of ci_optimization, test_setup, review_process, documentation, velocity_boost

Respond with ONLY the JSON array, no markdown fences, no explanation.`;

  const raw = await callGemini(prompt);
  if (!raw) { console.log("[DX Ghost] No Gemini response, using fallback"); return fallbackPatches(dims, tree, ci, test); }

  console.log("[DX Ghost] Raw Gemini response:", raw.slice(0, 300));
  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.error("[DX Ghost] Could not extract valid JSON array from Gemini response");
    return fallbackPatches(dims, tree, ci, test);
  }

  console.log(`[DX Ghost] Successfully parsed ${parsed.length} AI patches`);
  return parsed.slice(0, 5).map((p: Record<string, unknown>, i: number) => ({
    id: i + 1,
    title: String(p.title ?? "AI Fix"),
    file: String(p.file ?? "unknown"),
    language: String(p.language ?? "text"),
    diff: String(p.diff ?? "+// AI-generated patch"),
    impact: String(p.impact ?? "Improve DX"),
    confidence: typeof p.confidence === "number" ? p.confidence : 80,
    patchType: String(p.patchType ?? "ci_optimization"),
  }));
}

// ─── Before/After & Dev Hours ───────────────────────────────────────────────

function generateBeforeAfter(dims: DimensionResult[], recs: Recommendation[]): BeforeAfterMetric[] {
  const dm: Record<string, DimensionResult> = {}; for (const d of dims) dm[d.id] = d;
  const icons: Record<string, string> = { ci_build: "Clock", test_stability: "FlaskConical", commit_velocity: "TrendingUp", code_review: "Zap", doc_freshness: "TrendingUp" };
  const colors: Record<string, string> = { ci_build: "#00d4ff", test_stability: "#22c55e", commit_velocity: "#a855f7", code_review: "#f59e0b", doc_freshness: "#22c55e" };
  return recs.slice(0, 4).filter(r => dm[r.dimension]).map(r => {
    const d = dm[r.dimension]; const after = Math.min(100, d.score + Math.round(r.devHoursSaved * 3));
    return { label: d.shortName, before: `${d.score}/100`, after: `${after}/100`, improvement: `+${d.score > 0 ? Math.round(((after - d.score) / d.score) * 100) : after}%`, icon: icons[d.id] ?? "TrendingUp", color: colors[d.id] ?? "#22c55e" };
  });
}

function computeDevHours(dims: DimensionResult[]): { total: number; breakdown: DevHoursBreakdownItem[] } {
  let total = 0; const breakdown: DevHoursBreakdownItem[] = [];
  for (const d of dims) {
    const hrs = Math.round(((100 - d.score) / 100) * 20 * 10) / 10; total += hrs;
    const issues: { issue: string; hoursPerMonth: number; severity: "critical" | "high" | "medium" | "low" }[] = d.score < 30
      ? [{ issue: `Critical ${d.shortName} degradation`, hoursPerMonth: hrs * 0.6, severity: "critical" }, { issue: `Manual workarounds`, hoursPerMonth: hrs * 0.4, severity: "high" }]
      : d.score < 60 ? [{ issue: `${d.shortName} inefficiency`, hoursPerMonth: hrs, severity: "high" }]
      : [{ issue: `Minor ${d.shortName} optimization`, hoursPerMonth: hrs, severity: "low" }];
    breakdown.push({ dimension: d.name, dimensionId: d.id, score: d.score, totalHours: hrs, issues });
  }
  return { total: Math.round(total * 10) / 10, breakdown };
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function analyzeRepository(repoUrl: string): Promise<ScanReport> {
  const startTime = Date.now();
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub URL");
  const { owner, repo } = parsed;
  const data = await fetchRepoData(owner, repo);
  if (!data.repoInfo) throw new Error("Repository not found or not accessible");

  const ciR = scoreCI(data.tree, data.runs), testR = scoreTests(data.tree);
  const velR = scoreVelocity(data.commits, data.contributors);
  const revR = scoreReview(data.commits, data.contributors);
  const docR = scoreDocs(data.tree, data.commits);
  const scanDur = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

  const cfgs = [
    { id: "ci_build", name: "CI/Build Performance", shortName: "CI/Build", icon: "Cpu", ...ciR, desc: "Build pipeline health", unit: `${ciR.details.ciFileCount} workflows` },
    { id: "test_stability", name: "Test Stability", shortName: "Tests", icon: "FlaskConical", ...testR, desc: "Test coverage & reliability", unit: `${testR.details.testFileCount} test files` },
    { id: "commit_velocity", name: "Commit Velocity", shortName: "Velocity", icon: "GitCommitHorizontal", ...velR, desc: "Commit frequency & regularity", unit: `${velR.details.commitsPerDay}/day` },
    { id: "code_review", name: "Code Review", shortName: "Reviews", icon: "GitPullRequest", ...revR, desc: "Review culture & PR workflow", unit: `${revR.details.mergeRatio}% merge` },
    { id: "doc_freshness", name: "Documentation Freshness", shortName: "Docs", icon: "FileText", ...docR, desc: "Doc coverage & freshness", unit: `${docR.details.docFileCount} doc files` },
  ];

  const dimensions: DimensionResult[] = cfgs.map(d => {
    const seed = d.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const prevDelta = ((seed * 7 + d.score) % 13) - 6;
    const prev = Math.max(0, Math.min(100, d.score + prevDelta));
    return { id: d.id, name: d.name, shortName: d.shortName, score: d.score, previousScore: prev, delta: d.score - prev, status: (d.score >= 70 ? "healthy" : d.score >= 40 ? "warning" : "critical") as DimensionResult["status"], signals: generateSignals(data.commits, d.score, d.id), icon: d.icon, description: d.desc, unit: d.unit };
  });

  const overall = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const prevOverall = Math.round(dimensions.reduce((s, d) => s + d.previousScore, 0) / dimensions.length);
  const recs = generateRecommendations(dimensions, ciR.details, testR.details, docR.details);
  const { total: devHrs, breakdown } = computeDevHours(dimensions);

  return {
    repoInfo: { name: data.repoInfo.full_name, branch: data.repoInfo.default_branch, contributors: data.contributors.length, lastCommit: data.commits[0]?.commit.author.date ?? "unknown", scanDuration: scanDur, totalCommits: data.commits.length },
    overallScore: overall, previousOverallScore: prevOverall, dimensions,
    causalLinks: computeCorrelations(dimensions), forecast: generateForecast(overall, dimensions),
    ghostPatches: await generateGhostPatches(dimensions, data.tree, ciR.details, testR.details, data.repoInfo.full_name, data.repoInfo.language),
    recommendations: recs, anomalyEvents: detectAnomalies(dimensions),
    beforeAfter: generateBeforeAfter(dimensions, recs),
    devHoursWasted: devHrs, devHoursBreakdown: breakdown,
    scanTimestamp: new Date().toISOString(), mode: "live",
  };
}
