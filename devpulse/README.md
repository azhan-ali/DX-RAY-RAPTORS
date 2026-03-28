# DevPulse — Repository Health X-Ray

> Not a dashboard. An X-ray.

DevPulse scans any Git repository and produces an **ECG-style health report** across 5 critical developer experience dimensions. It identifies problems, traces causal chains, forecasts outcomes, and generates AI-powered fix patches — all from a single scan.

## What It Does

| Dimension | What It Measures |
|---|---|
| **CI/Build Performance** | Build duration, failure rate, caching efficiency |
| **Test Stability** | Flaky test rate, test coverage, execution time trends |
| **Commit Velocity** | Commit frequency, PR merge rate, contributor activity |
| **Code Review Lag** | Time-to-first-review, stale PRs, reviewer load |
| **Documentation Freshness** | README staleness, doc-to-code ratio, update frequency |

## Key Innovations

- **Causal Correlation Engine** — Time-lagged Pearson correlation between dimensions (e.g., "CI failures → commit velocity drops 3 days later, r = -0.72")
- **DX Time Machine** — 30-day forecast showing two futures: "Fix Now" vs "Do Nothing"
- **DX Ghost** — AI-powered patch writer using Google Gemini that generates concrete code fixes
- **3-Layer Fallback** — Live analysis → API fallback → Demo mode (never crashes)

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS v4, Framer Motion, Recharts |
| **Backend** | Next.js API Routes, Python 3.10+ analyzers |
| **AI** | Google Gemini 2.0 Flash (free tier) |
| **Icons** | Lucide React |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### Setup

```bash
# Clone
git clone https://github.com/azhan-ali/DX-RAY-RAPTORS.git
cd DX-RAY-RAPTORS

# Windows
setup.bat

# macOS/Linux
chmod +x setup.sh && ./setup.sh
```

### Run

```bash
cd devpulse
npm run dev
```

Open **http://localhost:3000** → Enter a repo path → Click **Scan Repository**

Or click **Demo** to see a pre-loaded report for facebook/react.

### Optional: Enable AI Patches

```bash
# Get a free API key from https://aistudio.google.com/apikey
export GEMINI_API_KEY=your_key_here
```

## Project Structure

```
DX-RAY-RAPTORS/
├── analyzers/                    # Python analysis engine
│   ├── git_analyzer.py           # Commit velocity + doc freshness + review lag
│   ├── ci_parser.py              # CI/build performance analysis
│   ├── test_analyzer.py          # Test stability + flaky detection
│   ├── score_engine.py           # Aggregates all scores + recommendations
│   ├── forecaster.py             # DX Time Machine (30-day forecast)
│   ├── correlation.py            # Causal Correlation Engine (Pearson r)
│   ├── ghost.py                  # DX Ghost AI patch writer (Gemini)
│   └── requirements.txt
├── devpulse/                     # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── api/scan/route.ts # API bridge to Python analyzers
│       │   ├── page.tsx          # Scan landing + dashboard
│       │   └── globals.css       # Dark medical ECG theme
│       ├── components/           # 10 UI components
│       │   ├── Header.tsx        # Fixed navbar with ECG heartbeat animation
│       │   ├── HeroScore.tsx     # Animated circular DX score
│       │   ├── VitalSigns.tsx    # 5 dimension cards with sparklines
│       │   ├── ECGSparklines.tsx # 28-day ECG monitor (5 channels)
│       │   ├── CausalChain.tsx   # SVG causal correlation graph
│       │   ├── TimeMachine.tsx   # Fix Now vs Do Nothing forecast
│       │   ├── DXGhost.tsx       # AI patch diff viewer
│       │   ├── Recommendations.tsx # Ranked fixes with dev-hours saved
│       │   ├── BeforeAfter.tsx   # Before/After impact comparison
│       │   └── Footer.tsx
│       └── lib/
│           ├── demoData.ts       # Demo fallback data
│           └── ReportContext.tsx  # React context for scan state
├── setup.sh                      # Unix setup script
├── setup.bat                     # Windows setup script
└── LICENSE                       # MIT
```

## Hackathon Tracks

- **Track A** — CI/Build Performance
- **Track B** — Test Health
- **Track G** — Code Review

## Team

**DX-RAY RAPTORS**

## License

MIT
