"""
DevPulse Causal Correlation Engine
Computes time-lagged Pearson correlation between dimension signal pairs.
Identifies causal chains: e.g., "CI build time spike → commit velocity drops 3 days later"
Outputs JSON to stdout.
"""

import json
import subprocess
import sys
import os
import math


def run_analyzer(script, repo_path):
    """Run another analyzer and parse its JSON output."""
    try:
        analyzers_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.join(analyzers_dir, script)
        result = subprocess.run(
            [sys.executable, script_path, repo_path],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=analyzers_dir,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
        return None
    except Exception:
        return None


def pearson_r(x, y):
    """Compute Pearson correlation coefficient between two lists."""
    n = len(x)
    if n < 3 or len(y) < 3:
        return 0.0

    n = min(len(x), len(y))
    x = x[:n]
    y = y[:n]

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    cov = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    std_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
    std_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))

    if std_x == 0 or std_y == 0:
        return 0.0

    return cov / (std_x * std_y)


def time_lagged_correlation(signal_a, signal_b, max_lag=7):
    """
    Compute time-lagged Pearson r between two signal arrays.
    Positive lag means signal_a leads signal_b by `lag` days.
    Returns (best_lag, best_r).
    """
    values_a = [s["value"] for s in signal_a]
    values_b = [s["value"] for s in signal_b]

    best_lag = 0
    best_r = 0.0

    for lag in range(0, max_lag + 1):
        if lag == 0:
            r = pearson_r(values_a, values_b)
        else:
            # a leads b by `lag` days: compare a[:-lag] with b[lag:]
            a_shifted = values_a[:-lag] if lag < len(values_a) else []
            b_shifted = values_b[lag:] if lag < len(values_b) else []
            r = pearson_r(a_shifted, b_shifted)

        if abs(r) > abs(best_r):
            best_r = r
            best_lag = lag

    return best_lag, round(best_r, 2)


# Dimension pair descriptions for causal interpretation
CAUSAL_TEMPLATES = {
    ("ci_build", "test_stability"): {
        "pos": "Faster CI builds correlate with more stable tests ({lag}d lag)",
        "neg": "CI build slowdowns destabilize tests after {lag} days",
    },
    ("ci_build", "commit_velocity"): {
        "pos": "Fast CI encourages more frequent commits ({lag}d lag)",
        "neg": "Slow CI pipelines reduce commit frequency after {lag} days",
    },
    ("test_stability", "commit_velocity"): {
        "pos": "Stable tests boost developer confidence to commit more ({lag}d lag)",
        "neg": "Test flakiness causes developers to slow down after {lag} days",
    },
    ("code_review", "commit_velocity"): {
        "pos": "Quick reviews keep commit velocity high ({lag}d lag)",
        "neg": "Review lag bottlenecks slow down commits after {lag} days",
    },
    ("code_review", "doc_freshness"): {
        "pos": "Active reviews encourage documentation updates ({lag}d lag)",
        "neg": "Review bottlenecks cause documentation to go stale after {lag} days",
    },
    ("ci_build", "code_review"): {
        "pos": "Fast CI enables quicker review cycles ({lag}d lag)",
        "neg": "CI failures delay code reviews after {lag} days",
    },
    ("test_stability", "code_review"): {
        "pos": "Stable tests speed up the review process ({lag}d lag)",
        "neg": "Flaky tests slow down code reviews after {lag} days",
    },
    ("commit_velocity", "doc_freshness"): {
        "pos": "Active development drives documentation updates ({lag}d lag)",
        "neg": "High commit velocity without docs leads to staleness after {lag} days",
    },
}


def generate_description(from_id, to_id, lag, r):
    """Generate a human-readable causal description."""
    key = (from_id, to_id)
    reverse_key = (to_id, from_id)

    templates = CAUSAL_TEMPLATES.get(key) or CAUSAL_TEMPLATES.get(reverse_key)

    if templates:
        if r > 0:
            return templates["pos"].format(lag=lag)
        else:
            return templates["neg"].format(lag=lag)

    direction = "positively" if r > 0 else "negatively"
    return f"{from_id} {direction} correlates with {to_id} (lag: {lag}d, r={r})"


def compute_correlations(repo_path):
    """Compute all pairwise time-lagged correlations."""

    score_data = run_analyzer("score_engine.py", repo_path)

    if not score_data or "dimensions" not in score_data:
        return {"error": "Could not get dimension data for correlation analysis"}

    dimensions = score_data["dimensions"]
    dim_map = {d["id"]: d for d in dimensions}

    # Compute all meaningful pairs
    dim_ids = [d["id"] for d in dimensions]
    causal_links = []

    for i in range(len(dim_ids)):
        for j in range(i + 1, len(dim_ids)):
            from_id = dim_ids[i]
            to_id = dim_ids[j]

            signals_a = dim_map[from_id]["signals"]
            signals_b = dim_map[to_id]["signals"]

            lag, r = time_lagged_correlation(signals_a, signals_b, max_lag=7)

            # Only include significant correlations
            if abs(r) >= 0.25:
                # Determine direction: positive lag means from leads to
                desc = generate_description(from_id, to_id, lag, r)

                causal_links.append({
                    "from": from_id,
                    "to": to_id,
                    "lag": lag,
                    "correlation": r,
                    "description": desc,
                })

    # Sort by absolute correlation (strongest first)
    causal_links.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # Keep top 6 links
    causal_links = causal_links[:6]

    output = {
        "causalLinks": causal_links,
        "totalPairsAnalyzed": len(dim_ids) * (len(dim_ids) - 1) // 2,
        "significantLinks": len(causal_links),
    }

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python correlation.py <repo_path>"}))
        sys.exit(1)

    repo_path = sys.argv[1]

    if not os.path.isdir(repo_path):
        print(json.dumps({"error": f"Not a directory: {repo_path}"}))
        sys.exit(1)

    try:
        result = compute_correlations(repo_path)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
