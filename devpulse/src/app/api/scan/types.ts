export interface ScanRequest {
  repoPath: string;
}

export interface DimensionSignal {
  day: number;
  date: string;
  value: number;
}

export interface DimensionResult {
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

export interface ForecastPoint {
  day: number;
  label: string;
  actual: number | null;
  fixNow: number | null;
  doNothing: number | null;
}

export interface SimulatedOutcome {
  applied: boolean;
  beforeMetrics: Record<string, string>;
  afterMetrics: Record<string, string>;
  estimatedImprovement: string;
  riskLevel: string;
}

export interface GhostPatch {
  id: number;
  title: string;
  file: string;
  language: string;
  diff: string;
  impact: string;
  confidence: number;
  patchType?: string;
  simulatedOutcome?: SimulatedOutcome;
  sourceIssue?: Record<string, string>;
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: "critical" | "high" | "medium";
  effort: string;
  devHoursSaved: number;
  dimension: string;
}

export interface AnomalyEvent {
  date: string;
  dimension: string;
  description: string;
  severity: "critical" | "warning" | "info";
  zScore?: number;
  value?: number;
  mean?: number;
  stdDev?: number;
}

export interface DevHoursIssue {
  issue: string;
  hoursPerMonth: number;
  severity: "critical" | "high" | "medium" | "low";
}

export interface DevHoursBreakdownItem {
  dimension: string;
  dimensionId: string;
  score: number;
  totalHours: number;
  issues: DevHoursIssue[];
}

export interface FlakyClassification {
  primaryCause: string;
  primaryCauseLabel: string;
  distribution: Record<string, number>;
  totalIndicators: number;
}

export interface BeforeAfterMetric {
  label: string;
  before: string;
  after: string;
  improvement: string;
  icon: string;
  color: string;
}

export interface ScanReport {
  repoInfo: {
    name: string;
    branch: string;
    contributors: number;
    lastCommit: string;
    scanDuration: string;
    totalCommits: number;
  };
  overallScore: number;
  previousOverallScore: number;
  dimensions: DimensionResult[];
  causalLinks: CausalLink[];
  forecast: ForecastPoint[];
  ghostPatches: GhostPatch[];
  recommendations: Recommendation[];
  anomalyEvents: AnomalyEvent[];
  beforeAfter: BeforeAfterMetric[];
  devHoursWasted: number;
  devHoursBreakdown?: DevHoursBreakdownItem[];
  flakyClassification?: FlakyClassification;
  ciAnalysis?: Record<string, unknown>;
  scanTimestamp: string;
  mode: "live" | "demo";
}
