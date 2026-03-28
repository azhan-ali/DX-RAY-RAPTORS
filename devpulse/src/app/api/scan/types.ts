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

export interface GhostPatch {
  id: number;
  title: string;
  file: string;
  language: string;
  diff: string;
  impact: string;
  confidence: number;
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
  scanTimestamp: string;
  mode: "live" | "demo";
}
