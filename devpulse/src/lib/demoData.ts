export interface DimensionSignal {
  day: number;
  date: string;
  value: number;
}

export interface Dimension {
  id: string;
  name: string;
  shortName: string;
  score: number;
  previousScore: number;
  delta: number;
  status: "critical" | "warning" | "healthy";
  signals: DimensionSignal[];
  icon: string;
  description: string;
  unit: string;
}

export interface CausalLink {
  from: string;
  to: string;
  lag: number;
  correlation: number;
  description: string;
}

export interface Recommendation {
  id: number;
  dimension: string;
  title: string;
  description: string;
  devHoursSaved: number;
  severity: "critical" | "warning" | "info";
  effort: "low" | "medium" | "high";
}

export interface ForecastPoint {
  day: number;
  label: string;
  actual: number | null;
  fixNow: number | null;
  doNothing: number | null;
}

export interface GhostPatch {
  file: string;
  description: string;
  estimatedSaving: string;
  lines: { type: "add" | "remove" | "neutral"; content: string }[];
}

export interface RepoInfo {
  name: string;
  branch: string;
  lastCommit: string;
  totalCommits: number;
  contributors: number;
  scanDuration: string;
  scanDate: string;
}

// Generate 28 days of signal data
function generateSignal(
  base: number,
  variance: number,
  trend: number,
  spikeDays: number[] = []
): DimensionSignal[] {
  const signals: DimensionSignal[] = [];
  for (let i = 0; i < 28; i++) {
    const date = new Date(2026, 2, i + 1);
    let value = base + trend * i + (Math.random() - 0.5) * variance;
    if (spikeDays.includes(i)) {
      value = value * (0.4 + Math.random() * 0.3);
    }
    value = Math.max(0, Math.min(100, value));
    signals.push({
      day: i + 1,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 10) / 10,
    });
  }
  return signals;
}

export const repoInfo: RepoInfo = {
  name: "facebook/react",
  branch: "main",
  lastCommit: "a8f9b2c",
  totalCommits: 18472,
  contributors: 247,
  scanDuration: "12.4s",
  scanDate: "Mar 27, 2026 — 20:14 UTC",
};

export const overallScore = 41;
export const previousOverallScore = 38;

export const dimensions: Dimension[] = [
  {
    id: "ci-build",
    name: "CI/Build Performance",
    shortName: "CI/Build",
    score: 38,
    previousScore: 42,
    delta: -4,
    status: "critical",
    signals: generateSignal(45, 20, -0.5, [7, 14, 21]),
    icon: "Cpu",
    description: "Build duration, failure rate, pipeline throughput",
    unit: "avg 18.4 min",
  },
  {
    id: "test-stability",
    name: "Test Stability",
    shortName: "Tests",
    score: 45,
    previousScore: 41,
    delta: +4,
    status: "warning",
    signals: generateSignal(50, 25, -0.2, [8, 15, 22]),
    icon: "FlaskConical",
    description: "Flaky rate, coverage gaps, execution time",
    unit: "23% flaky",
  },
  {
    id: "commit-velocity",
    name: "Commit Velocity",
    shortName: "Velocity",
    score: 62,
    previousScore: 65,
    delta: -3,
    status: "warning",
    signals: generateSignal(65, 15, -0.3, []),
    icon: "GitCommitHorizontal",
    description: "Commit frequency, author distribution, churn rate",
    unit: "4.2/day",
  },
  {
    id: "review-lag",
    name: "Code Review Lag",
    shortName: "Reviews",
    score: 35,
    previousScore: 33,
    delta: +2,
    status: "critical",
    signals: generateSignal(38, 18, -0.1, [5, 12, 19]),
    icon: "GitPullRequest",
    description: "Time-to-first-review, reviewer load, PR size",
    unit: "26h avg",
  },
  {
    id: "doc-freshness",
    name: "Documentation Freshness",
    shortName: "Docs",
    score: 51,
    previousScore: 53,
    delta: -2,
    status: "warning",
    signals: generateSignal(55, 12, -0.2, []),
    icon: "FileText",
    description: "Staleness ratio, code-to-doc drift, update frequency",
    unit: "40% stale",
  },
];

export const causalLinks: CausalLink[] = [
  {
    from: "test-stability",
    to: "ci-build",
    lag: 7,
    correlation: 0.87,
    description: "Test flakiness spike → CI failure surge 7 days later",
  },
  {
    from: "ci-build",
    to: "commit-velocity",
    lag: 3,
    correlation: 0.72,
    description: "CI failures → Commit velocity drop 3 days later",
  },
  {
    from: "review-lag",
    to: "commit-velocity",
    lag: 5,
    correlation: 0.68,
    description: "Review bottleneck → Velocity decrease 5 days later",
  },
  {
    from: "commit-velocity",
    to: "doc-freshness",
    lag: 14,
    correlation: 0.61,
    description: "Velocity drop → Documentation staleness 14 days later",
  },
];

export const recommendations: Recommendation[] = [
  {
    id: 1,
    dimension: "ci-build",
    title: "Enable build caching for node_modules",
    description:
      "CI spends 4.2 min reinstalling dependencies on every run. Adding cache: npm to workflow will reduce build time by ~35%.",
    devHoursSaved: 6.8,
    severity: "critical",
    effort: "low",
  },
  {
    id: 2,
    dimension: "test-stability",
    title: "Quarantine 12 flaky tests identified as race_condition",
    description:
      "12 tests fail intermittently due to shared state in parallel runs. Isolating them eliminates 78% of false CI failures.",
    devHoursSaved: 4.2,
    severity: "critical",
    effort: "medium",
  },
  {
    id: 3,
    dimension: "review-lag",
    title: "Implement round-robin reviewer assignment",
    description:
      "3 reviewers handle 74% of all PRs. Distributing load evenly would cut time-to-first-review from 26h to ~8h.",
    devHoursSaved: 3.1,
    severity: "warning",
    effort: "low",
  },
  {
    id: 4,
    dimension: "ci-build",
    title: "Parallelize test and lint steps in CI pipeline",
    description:
      "Tests and linting run sequentially (8.1 min total). Running in parallel saves 3.4 min per build.",
    devHoursSaved: 2.4,
    severity: "warning",
    effort: "medium",
  },
  {
    id: 5,
    dimension: "doc-freshness",
    title: "Add doc-drift CI check for API endpoints",
    description:
      "14 API docs reference deprecated endpoints. Auto-detecting drift prevents misleading documentation.",
    devHoursSaved: 1.5,
    severity: "info",
    effort: "high",
  },
];

export const forecastData: ForecastPoint[] = [
  { day: 1, label: "Week 1", actual: 44, fixNow: null, doNothing: null },
  { day: 7, label: "Week 2", actual: 42, fixNow: null, doNothing: null },
  { day: 14, label: "Week 3", actual: 40, fixNow: null, doNothing: null },
  { day: 21, label: "Week 4", actual: 41, fixNow: null, doNothing: null },
  { day: 28, label: "Now", actual: 41, fixNow: 41, doNothing: 41 },
  { day: 35, label: "+1w", actual: null, fixNow: 49, doNothing: 38 },
  { day: 42, label: "+2w", actual: null, fixNow: 56, doNothing: 35 },
  { day: 49, label: "+3w", actual: null, fixNow: 62, doNothing: 31 },
  { day: 56, label: "+4w", actual: null, fixNow: 67, doNothing: 28 },
];

export const ghostPatches: GhostPatch[] = [
  {
    file: ".github/workflows/ci.yml",
    description: "Add dependency caching + parallelize test/lint steps",
    estimatedSaving: "Build time: 18.4 min → 6.1 min (−67%)",
    lines: [
      { type: "neutral", content: "jobs:" },
      { type: "neutral", content: "  build:" },
      { type: "neutral", content: "    runs-on: ubuntu-latest" },
      { type: "neutral", content: "    steps:" },
      { type: "neutral", content: "      - uses: actions/checkout@v4" },
      { type: "add", content: "      - uses: actions/cache@v4" },
      { type: "add", content: "        with:" },
      { type: "add", content: "          path: ~/.npm" },
      { type: "add", content: '          key: ${{ runner.os }}-node-${{ hashFiles(\'**/package-lock.json\') }}' },
      { type: "neutral", content: "      - run: npm ci" },
      { type: "remove", content: "      - run: npm run lint" },
      { type: "remove", content: "      - run: npm test" },
      { type: "add", content: "      - run: npm run lint & npm test & wait" },
      { type: "neutral", content: "" },
      { type: "neutral", content: "  # Estimated new build time: 6.1 min" },
      { type: "neutral", content: "  # Saving: 12.3 min per run × 8 runs/day = 1.6 dev-hours/day" },
    ],
  },
  {
    file: "jest.config.js",
    description: "Isolate flaky tests with --runInBand for race_condition category",
    estimatedSaving: "Flaky failures: 23/week → 0/week",
    lines: [
      { type: "neutral", content: "module.exports = {" },
      { type: "neutral", content: "  testEnvironment: 'jsdom'," },
      { type: "remove", content: "  testMatch: ['**/__tests__/**/*.test.js']," },
      { type: "add", content: "  testMatch: ['**/__tests__/**/*.test.js']," },
      { type: "add", content: "  projects: [" },
      { type: "add", content: "    {" },
      { type: "add", content: "      displayName: 'stable'," },
      { type: "add", content: "      testPathIgnorePatterns: ['__tests__/flaky/']," },
      { type: "add", content: "    }," },
      { type: "add", content: "    {" },
      { type: "add", content: "      displayName: 'quarantined'," },
      { type: "add", content: "      testMatch: ['**/__tests__/flaky/**/*.test.js']," },
      { type: "add", content: "      runner: 'jest-runner-serial'," },
      { type: "add", content: "    }," },
      { type: "add", content: "  ]," },
      { type: "neutral", content: "};" },
    ],
  },
];

export const anomalyEvents = [
  {
    date: "Mar 8",
    dimension: "ci-build",
    description: "CI build time spiked from 12 min to 24 min",
    commitRange: "a3f21c8...b7e49d1",
    zScore: 3.2,
  },
  {
    date: "Mar 15",
    dimension: "test-stability",
    description: "Flaky test rate jumped from 8% to 31%",
    commitRange: "c4d89e2...d1a73f5",
    zScore: 2.8,
  },
  {
    date: "Mar 22",
    dimension: "review-lag",
    description: "Average review time exceeded 48 hours",
    commitRange: "e5f12a9...f8b34c7",
    zScore: 2.4,
  },
];

export const devHoursWasted = {
  total: 14.3,
  breakdown: [
    { dimension: "CI/Build", hours: 6.8, percentage: 47.6 },
    { dimension: "Test Flakiness", hours: 4.2, percentage: 29.4 },
    { dimension: "Review Lag", hours: 3.1, percentage: 21.7 },
    { dimension: "Doc Drift", hours: 0.2, percentage: 1.3 },
  ],
};
