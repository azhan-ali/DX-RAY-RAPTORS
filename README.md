<div align="center">

```
    ██████╗ ███████╗██╗   ██╗██████╗ ██╗   ██╗██╗     ███████╗███████╗
    ██╔══██╗██╔════╝██║   ██║██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
    ██║  ██║█████╗  ██║   ██║██████╔╝██║   ██║██║     ███████╗█████╗  
    ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  
    ██████╔╝███████╗ ╚████╔╝ ██║     ╚██████╔╝███████╗███████║███████╗
    ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
```

### `An ECG for your codebase. Not a dashboard — an X-ray.`

[![Live Demo](https://img.shields.io/badge/LIVE-dx--ray--raptors.vercel.app-00ff88?style=for-the-badge&logo=vercel&logoColor=white)](https://dx-ray-raptors.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

---

**Your repository is bleeding dev-hours. You just don't know it yet.**

DevPulse scans any GitHub repository and produces a **real-time health diagnostic** — like an ECG machine, but for code. It detects hidden problems, traces cause-and-effect chains between metrics, forecasts your project's future, and writes AI-powered fix patches — all from a single URL.

</div>

---

## The Problem

> Every engineering team loses **20-80 dev-hours/month** to invisible DX problems — slow CI, flaky tests, review bottlenecks, stale docs. But nobody connects the dots. A slow build today causes fewer commits tomorrow, which causes stale PRs next week.

**DevPulse connects the dots.**

---

## What Makes DevPulse Different

<table>
<tr>
<td width="50%">

### Scan — Don't Configure
Paste a GitHub URL. That's it. No YAML configs, no SDK installs, no access tokens needed. DevPulse analyzes public repos instantly via the GitHub API.

</td>
<td width="50%">

### Diagnose — Don't Guess
5 vital dimensions scored 0-100 with 28-day ECG sparklines. See exactly where your DX is healthy, warning, or critical — backed by real commit data.

</td>
</tr>
<tr>
<td width="50%">

### Connect — Don't Silo
The **Causal Correlation Engine** discovers hidden cause-and-effect chains between dimensions using time-lagged Pearson correlation. *"CI failures → commit velocity drops 3 days later (r = -0.72)"*

</td>
<td width="50%">

### Fix — Don't Just Report
**DX Ghost** (powered by Gemini AI) doesn't just tell you what's wrong — it writes the actual code patches to fix it, with estimated dev-hours saved per fix.

</td>
</tr>
</table>

---

## 9 Diagnostic Modules

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   MODULE 1  ░░  Hero Score          Overall DX health 0-100     │
│   MODULE 2  ░░  Vital Signs         5 dimension cards           │
│   MODULE 3  ░░  ECG Monitor         28-day signal sparklines    │
│   MODULE 4  ░░  Causal Chain        Correlation graph (SVG)     │
│   MODULE 5  ░░  DX Time Machine     30-day "Fix Now vs Ignore"  │
│   MODULE 6  ░░  DX Ghost            AI patch writer (Gemini)    │
│   MODULE 7  ░░  Recommendations     Ranked fixes by ROI         │
│   MODULE 8  ░░  Before / After      Impact projection           │
│   MODULE 9  ░░  Dev Hours Wasted    Monthly cost breakdown      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5 Vital Dimensions

| # | Dimension | What It Scans | Source |
|---|-----------|---------------|--------|
| 1 | **CI/Build Performance** | Workflow configs, run success rates, build frequency | GitHub Actions API |
| 2 | **Test Stability** | Test file count, framework detection, coverage ratio | Repo file tree |
| 3 | **Commit Velocity** | Commits/day, active authors, regularity over 28 days | Commit history |
| 4 | **Code Review** | Merge commit ratio, PR workflow, commit message quality | Git log analysis |
| 5 | **Doc Freshness** | README, /docs, CHANGELOG, recent doc-related commits | Tree + commit scan |

---

## Key Innovations

### 1. Causal Correlation Engine
Most tools show metrics in isolation. DevPulse **connects them**. Using time-lagged Pearson correlation across 28 days of signal data, it discovers relationships like:

```
CI/Build (lag 2d) ──────→ Test Stability     r = +0.68
Test Stability (lag 3d) ─→ Commit Velocity    r = -0.72
Code Review (lag 1d) ────→ Doc Freshness      r = +0.54
```

> "Your CI failures are causing your test instability, which is slowing down your developers."

### 2. DX Time Machine
A 30-day forecast showing two diverging futures:
- **Fix Now** — Score trajectory if you apply recommended fixes today
- **Do Nothing** — Score degradation if problems compound unchecked

The gap between these lines is the **cost of inaction**.

### 3. DX Ghost — AI Fix Writer
Powered by **Google Gemini**, DX Ghost doesn't just flag problems — it writes production-ready patches:
- Analyzes your repo's language, file structure, CI setup, and weak dimensions
- Generates targeted code diffs (CI configs, test setups, CODEOWNERS, docs)
- Shows estimated dev-hours saved per patch
- Copy-paste ready with `git apply`

### 4. 3-Layer Resilience
```
Layer 1: Live GitHub API Analysis  →  Real data from your repo
Layer 2: API Error Fallback        →  Graceful degradation
Layer 3: Demo Mode                 →  Pre-loaded sample report
```
**DevPulse never crashes. Never shows a blank screen. Always delivers value.**

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 + React 19 | App Router, Server Components, API Routes |
| **Styling** | TailwindCSS v4 | Dark medical-grade theme, responsive |
| **Animation** | Framer Motion | Smooth transitions, viewport-triggered reveals |
| **Charts** | Recharts | ECG sparklines, forecast area charts |
| **AI** | Google Gemini 2.0 Flash | Ghost patch generation (free tier) |
| **Data** | GitHub REST API | No auth needed for public repos |
| **Icons** | Lucide React | Consistent medical-themed iconography |
| **Deploy** | Vercel | Auto-deploy from GitHub, edge functions |

---

## Quick Start

### One-Command Setup

```bash
# Clone the repo
git clone https://github.com/azhan-ali/DX-RAY-RAPTORS.git
cd DX-RAY-RAPTORS/devpulse

# Install & run
npm install
npm run dev
```

Open **http://localhost:3000** → Paste any GitHub repo URL → Hit **Scan**

### Enable AI Ghost Patches (Optional)

```bash
# Get a free key: https://aistudio.google.com/apikey
# Create devpulse/.env.local:
GEMINI_API_KEY=your_key_here
```

---

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/azhan-ali/DX-RAY-RAPTORS&root-directory=devpulse)

1. Click the button above (or import from GitHub on vercel.com)
2. Set **Root Directory** to `devpulse`
3. Add env variable: `GEMINI_API_KEY` (optional, for AI patches)
4. Deploy — done!

---

## Project Architecture

```
DX-RAY-RAPTORS/
│
├── devpulse/                          # Next.js 16 Application
│   └── src/
│       ├── app/
│       │   ├── api/scan/
│       │   │   ├── route.ts           # POST endpoint — orchestrates scan
│       │   │   ├── analyzers.ts       # TypeScript GitHub API analyzers
│       │   │   └── types.ts           # Full type definitions
│       │   ├── page.tsx               # Landing + Dashboard (SPA)
│       │   ├── layout.tsx             # Root layout with viewport config
│       │   └── globals.css            # Dark ECG theme + animations
│       ├── components/
│       │   ├── Header.tsx             # Fixed navbar + back button + ECG pulse
│       │   ├── HeroScore.tsx          # Animated circular DX score (0-100)
│       │   ├── VitalSigns.tsx         # 5 dimension cards with mini sparklines
│       │   ├── ECGSparklines.tsx      # 28-day multi-channel ECG monitor
│       │   ├── CausalChain.tsx        # SVG correlation graph + chain list
│       │   ├── TimeMachine.tsx        # Fix Now vs Do Nothing forecast chart
│       │   ├── DXGhost.tsx            # AI patch viewer with syntax-highlighted diffs
│       │   ├── Recommendations.tsx    # Ranked fixes sorted by dev-hours ROI
│       │   ├── BeforeAfter.tsx        # Before/After impact comparison
│       │   └── Footer.tsx             # Scan metadata + credits
│       └── lib/
│           ├── ReportContext.tsx       # React Context for scan state management
│           └── demoData.ts            # Demo fallback dataset
│
├── analyzers/                         # Python analysis engine (local mode)
│   ├── git_analyzer.py                # Commit velocity + doc freshness
│   ├── ci_parser.py                   # CI/build performance analysis
│   ├── test_analyzer.py               # Test stability + flaky classification
│   ├── score_engine.py                # Score aggregation + recommendations
│   ├── forecaster.py                  # 30-day forecast generator
│   ├── correlation.py                 # Causal Correlation Engine (Pearson r)
│   └── ghost.py                       # DX Ghost AI patch writer (Gemini)
│
├── setup.sh / setup.bat               # One-command setup scripts
└── LICENSE                            # MIT
```

---

## How The Scoring Works

Each dimension is scored **0-100** based on real repository data:

```
Score 80-100  →  HEALTHY   (green)    Your DX is strong here
Score 40-79   →  WARNING   (yellow)   Needs attention before it degrades
Score 0-39    →  CRITICAL  (red)      Actively bleeding dev-hours
```

**Overall DX Score** = weighted average of all 5 dimensions.

The **Dev Hours Wasted** metric converts low scores into tangible monthly cost:
> *"Your repository wastes approximately 47.2 dev-hours/month due to DX problems."*

---

## Real Results, Real Differences

| Repository | DX Score | CI | Tests | Velocity | Reviews | Docs |
|-----------|---------|-----|-------|----------|---------|------|
| **facebook/react** | 77 | 82 | 80 | 71 | 65 | 85 |
| **expressjs/express** | 55 | 68 | 80 | 0 | 63 | 65 |
| **vuejs/vue** | 48 | 22 | 100 | 0 | 62 | 55 |

> Every repo gets genuinely different analysis. No fake data. No hardcoded scores.

---

## API Rate Limits

DevPulse uses the GitHub REST API:
- **Without token**: 60 requests/hour (~12 scans/hour)
- **With `GITHUB_TOKEN`**: 5,000 requests/hour (unlimited scans)

Add `GITHUB_TOKEN` as an env variable for high-volume usage.

---

## Team

<div align="center">

### DX-RAY RAPTORS

*Built for the hackathon. Built to ship.*

</div>

---

## License

MIT — use it, fork it, ship it.

---

<div align="center">

```
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   Your codebase has a pulse.                     ║
  ║   DevPulse reads it.                             ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
```

**[Try the Live Demo →](https://dx-ray-raptors.vercel.app/)**

</div>
