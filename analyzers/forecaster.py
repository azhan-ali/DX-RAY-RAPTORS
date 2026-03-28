"""
DevPulse DX Time Machine — Forecaster
Generates 30-day forecasts for DX score: "Fix Now" vs "Do Nothing" scenarios.
Uses linear regression + exponential smoothing on 28-day signal history.
Outputs JSON to stdout.
"""

import json
import subprocess
import sys
import os
import math
from datetime import datetime, timedelta


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


def linear_regression(values):
    """Simple linear regression: returns slope and intercept."""
    n = len(values)
    if n < 2:
        return 0, values[0] if values else 50

    x_mean = (n - 1) / 2
    y_mean = sum(values) / n

    numerator = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    slope = numerator / denominator if denominator != 0 else 0
    intercept = y_mean - slope * x_mean

    return slope, intercept


def exponential_smoothing(values, alpha=0.3):
    """Simple exponential smoothing to get trend."""
    if not values:
        return 50

    smoothed = values[0]
    for v in values[1:]:
        smoothed = alpha * v + (1 - alpha) * smoothed

    return smoothed


def forecast_scenario(signals, scenario="do_nothing", days=30):
    """Generate forecast for a given scenario."""
    values = [s["value"] for s in signals]
    if not values:
        return []

    slope, intercept = linear_regression(values)
    last_smoothed = exponential_smoothing(values)
    last_value = values[-1]

    forecast = []
    today = datetime.now()

    for i in range(days):
        day_offset = len(values) + i

        if scenario == "do_nothing":
            # Continue current trend (slightly worse due to entropy)
            trend_value = slope * day_offset + intercept
            decay = i * 0.3  # gradual decay from inaction
            projected = trend_value - decay

        elif scenario == "fix_now":
            # Improvement curve: rapid early gains, plateauing
            improvement_rate = 1.5 * math.exp(-i * 0.05)  # diminishing returns
            base = last_smoothed + (i * improvement_rate)
            projected = min(95, base)  # cap at 95

        else:
            projected = last_value

        projected = max(5, min(100, projected))
        day_date = today + timedelta(days=i + 1)

        forecast.append({
            "day": day_offset + 1,
            "label": day_date.strftime("%b %d"),
            "value": round(projected, 1),
        })

    return forecast


def generate_forecast(repo_path):
    """Generate complete Time Machine forecast."""

    # Get score engine data for current signals
    score_data = run_analyzer("score_engine.py", repo_path)

    if not score_data or "dimensions" not in score_data:
        return {"error": "Could not get dimension data for forecasting"}

    dimensions = score_data["dimensions"]

    # Compute weighted overall signal (28 days)
    weights = {"ci_build": 0.25, "test_stability": 0.25, "commit_velocity": 0.2, "code_review": 0.15, "doc_freshness": 0.15}

    # Build overall 28-day signal
    overall_signals = []
    for day_idx in range(28):
        weighted_sum = 0
        for dim in dimensions:
            w = weights.get(dim["id"], 0.2)
            if day_idx < len(dim["signals"]):
                weighted_sum += dim["signals"][day_idx]["value"] * w
        overall_signals.append({
            "day": day_idx + 1,
            "date": dimensions[0]["signals"][day_idx]["date"] if dimensions and day_idx < len(dimensions[0]["signals"]) else f"Day {day_idx + 1}",
            "value": round(weighted_sum),
        })

    # Generate forecasts
    fix_now = forecast_scenario(overall_signals, "fix_now", 30)
    do_nothing = forecast_scenario(overall_signals, "do_nothing", 30)

    # Build combined forecast array for chart
    today = datetime.now()
    forecast_points = []

    # Historical data (last 14 days of 28)
    for i, sig in enumerate(overall_signals[14:]):
        forecast_points.append({
            "day": i + 1,
            "label": sig["date"],
            "actual": sig["value"],
            "fixNow": None,
            "doNothing": None,
        })

    # "Now" point — bridge between historical and forecast
    last_actual = overall_signals[-1]["value"]
    forecast_points.append({
        "day": 15,
        "label": "Now",
        "actual": last_actual,
        "fixNow": last_actual,
        "doNothing": last_actual,
    })

    # Forecast data (next 14 days)
    for i in range(14):
        forecast_points.append({
            "day": 16 + i,
            "label": fix_now[i]["label"],
            "actual": None,
            "fixNow": fix_now[i]["value"],
            "doNothing": do_nothing[i]["value"],
        })

    # Calculate cost of inaction
    fix_end = fix_now[13]["value"] if len(fix_now) > 13 else fix_now[-1]["value"]
    nothing_end = do_nothing[13]["value"] if len(do_nothing) > 13 else do_nothing[-1]["value"]
    score_gap = round(fix_end - nothing_end, 1)

    output = {
        "forecast": forecast_points,
        "summary": {
            "currentScore": last_actual,
            "fixNowProjected": round(fix_end, 1),
            "doNothingProjected": round(nothing_end, 1),
            "scoreGap": score_gap,
            "daysToHealthy": max(3, int(30 * (70 - last_actual) / max(fix_end - last_actual, 1))) if last_actual < 70 and fix_end > last_actual else 0,
        },
    }

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python forecaster.py <repo_path>"}))
        sys.exit(1)

    repo_path = sys.argv[1]

    if not os.path.isdir(repo_path):
        print(json.dumps({"error": f"Not a directory: {repo_path}"}))
        sys.exit(1)

    try:
        result = generate_forecast(repo_path)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
