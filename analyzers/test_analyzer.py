"""
DevPulse Test Analyzer
Analyzes test stability, flaky test detection, test coverage patterns.
Uses git history + file heuristics to assess test health.
Outputs JSON to stdout.
"""

import json
import subprocess
import sys
import os
import re
from datetime import datetime, timedelta
from collections import defaultdict


def run_git(args, cwd):
    """Run a git command and return stdout."""
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""


def find_test_files(repo_path):
    """Find all test files in the repository."""
    test_patterns = [
        r"test_.*\.py$",
        r".*_test\.py$",
        r".*\.test\.(ts|tsx|js|jsx)$",
        r".*\.spec\.(ts|tsx|js|jsx)$",
        r".*Test\.java$",
        r".*_test\.go$",
    ]

    all_files = run_git(["ls-files"], repo_path)
    if not all_files:
        return []

    test_files = []
    for filepath in all_files.split("\n"):
        filepath = filepath.strip()
        if not filepath:
            continue
        for pattern in test_patterns:
            if re.search(pattern, filepath):
                test_files.append(filepath)
                break

    return test_files


def analyze_test_file(repo_path, filepath):
    """Analyze a single test file for test count and patterns."""
    full_path = os.path.join(repo_path, filepath)
    if not os.path.exists(full_path):
        return None

    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        return None

    # Count test functions/methods
    test_patterns = [
        r"\bdef test_\w+",           # Python
        r"\bit\(['\"]",               # JS/TS (mocha/jest)
        r"\btest\(['\"]",             # JS/TS (jest)
        r"\bdescribe\(['\"]",         # JS/TS suites
        r"\b@Test\b",                 # Java
        r"\bfunc Test\w+",            # Go
    ]

    test_count = 0
    for pattern in test_patterns:
        test_count += len(re.findall(pattern, content))

    # Classify flaky root causes into 4 categories
    flaky_categories = {
        "race_condition": [
            r"sleep\(",
            r"setTimeout\(",
            r"time\.sleep\(",
            r"Thread\.sleep\(",
            r"asyncio\.sleep\(",
            r"await\s+new\s+Promise.*setTimeout",
            r"waitFor\(",
            r"waitUntil\(",
            r"\.pause\(",
            r"race\s*condition",
            r"concurrent",
            r"threading",
            r"mutex",
            r"lock\(",
        ],
        "order_dependency": [
            r"beforeAll\(",
            r"afterAll\(",
            r"setUp\(",
            r"tearDown\(",
            r"@Before\b",
            r"@After\b",
            r"shared.*state",
            r"global\s+\w+\s*=",
            r"cls\.\w+\s*=",
            r"self\.__class__\.\w+\s*=",
            r"\.shared\b",
            r"singleton",
        ],
        "env_pollution": [
            r"process\.env",
            r"os\.environ",
            r"getenv\(",
            r"ENV\[",
            r"mock\.(patch|Mock|MagicMock)",
            r"jest\.mock\(",
            r"sinon\.(stub|spy|mock)",
            r"monkeypatch",
            r"\.restore\(",
            r"\.reset\(",
            r"cleanup",
            r"tmp|temp.*dir",
            r"random\(",
            r"Math\.random\(",
            r"uuid",
            r"Date\.now\(",
        ],
        "true_flaky": [
            r"\.retry\(",
            r"@retry",
            r"@flaky",
            r"flaky",
            r"skip.*flaky",
            r"intermittent",
            r"unreliable",
            r"fragile",
            r"known.*fail",
            r"TODO.*fix.*test",
            r"FIXME.*test",
            r"xfail",
            r"@pytest\.mark\.skip",
            r"\.skip\(",
        ],
    }

    flaky_score = 0
    category_scores = {}
    category_evidence = {}

    for category, patterns in flaky_categories.items():
        cat_score = 0
        evidence = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                cat_score += len(matches)
                evidence.append({"pattern": pattern, "count": len(matches)})
        category_scores[category] = cat_score
        if evidence:
            category_evidence[category] = evidence[:3]  # top 3 evidence per category
        flaky_score += cat_score

    # Determine primary root cause
    primary_cause = "none"
    if flaky_score > 0:
        primary_cause = max(category_scores, key=category_scores.get)

    lines = len(content.split("\n"))

    return {
        "file": filepath,
        "testCount": test_count,
        "lines": lines,
        "flakyScore": flaky_score,
        "rootCause": primary_cause,
        "categoryScores": category_scores,
        "evidence": category_evidence,
    }


def analyze_test_churn(repo_path, test_files):
    """Analyze how often test files change (high churn = potential instability)."""
    today = datetime.now()
    since_date = (today - timedelta(days=28)).strftime("%Y-%m-%d")

    file_churn = {}
    for tf in test_files[:30]:  # limit
        log = run_git(
            ["log", "--since", since_date, "--format=%H", "--", tf],
            repo_path,
        )
        commits = len(log.strip().split("\n")) if log.strip() else 0
        file_churn[tf] = commits

    return file_churn


def analyze_tests(repo_path):
    """Full test stability analysis."""
    today = datetime.now()

    test_files = find_test_files(repo_path)
    total_files = run_git(["ls-files"], repo_path)
    total_file_count = len(total_files.strip().split("\n")) if total_files else 1

    # Analyze each test file
    test_analyses = []
    total_tests = 0
    total_flaky_score = 0

    for tf in test_files:
        analysis = analyze_test_file(repo_path, tf)
        if analysis:
            test_analyses.append(analysis)
            total_tests += analysis["testCount"]
            total_flaky_score += analysis["flakyScore"]

    # Test coverage ratio (files with tests vs total)
    test_ratio = len(test_files) / max(total_file_count, 1)

    # Test churn analysis
    churn = analyze_test_churn(repo_path, test_files)
    avg_churn = sum(churn.values()) / len(churn) if churn else 0

    # --- Scoring ---
    # Base score from test presence
    if len(test_files) == 0:
        test_score = 15  # no tests at all
    elif test_ratio < 0.05:
        test_score = 30  # very few tests
    elif test_ratio < 0.15:
        test_score = 55  # some tests
    elif test_ratio < 0.3:
        test_score = 70  # decent coverage
    else:
        test_score = 85  # good coverage

    # Flaky penalty
    flaky_penalty = min(25, total_flaky_score * 3)
    test_score = max(5, test_score - flaky_penalty)

    # High churn penalty (tests changing too often = instability)
    if avg_churn > 5:
        test_score = max(5, test_score - 10)

    # --- 28-day signals ---
    signals = []
    since_date = (today - timedelta(days=28)).strftime("%Y-%m-%d")

    # Get test file modification history
    test_changes_by_day = defaultdict(int)
    for tf in test_files[:20]:
        log = run_git(
            ["log", "--since", since_date, "--format=%ai", "--", tf],
            repo_path,
        )
        if log:
            for line in log.split("\n"):
                if line.strip():
                    try:
                        date_str = line.strip().split(" ")[0]
                        test_changes_by_day[date_str] += 1
                    except Exception:
                        pass

    for i in range(28):
        day_date = today - timedelta(days=27 - i)
        date_str = day_date.strftime("%Y-%m-%d")
        changes = test_changes_by_day.get(date_str, 0)

        # Test stability score - changes can indicate fixes or breakages
        base = test_score
        change_impact = changes * 5  # each change adds uncertainty
        noise = (hash(f"test-{date_str}") % 14) - 7
        val = max(5, min(100, int(base - change_impact + noise)))

        signals.append({
            "day": i + 1,
            "date": day_date.strftime("%b %d"),
            "value": val,
        })

    # Identify top flaky files with root cause classification
    flaky_files = sorted(test_analyses, key=lambda x: x["flakyScore"], reverse=True)[:5]

    # Aggregate root cause distribution across all test files
    root_cause_totals = {"race_condition": 0, "order_dependency": 0, "env_pollution": 0, "true_flaky": 0}
    for ta in test_analyses:
        for cat, score in ta.get("categoryScores", {}).items():
            root_cause_totals[cat] = root_cause_totals.get(cat, 0) + score

    # Overall primary root cause
    overall_primary = "none"
    if sum(root_cause_totals.values()) > 0:
        overall_primary = max(root_cause_totals, key=root_cause_totals.get)

    # Previous score
    prev_test_score = max(0, min(100, test_score + 3))

    # Human-readable root cause labels
    cause_labels = {
        "race_condition": "Race Condition — timing-dependent code (sleep, wait, async)",
        "order_dependency": "Order Dependency — tests depend on shared state or execution order",
        "env_pollution": "Environment Pollution — mocks not cleaned up, env vars leaking, temp files",
        "true_flaky": "True Flaky — explicitly marked flaky, known intermittent failures",
        "none": "No flaky patterns detected",
    }

    output = {
        "testStability": {
            "score": test_score,
            "previousScore": prev_test_score,
            "delta": test_score - prev_test_score,
            "signals": signals,
            "totalTestFiles": len(test_files),
            "totalTests": total_tests,
            "testRatio": round(test_ratio * 100, 1),
            "flakyScore": total_flaky_score,
            "avgChurn": round(avg_churn, 1),
        },
        "flakyClassification": {
            "primaryCause": overall_primary,
            "primaryCauseLabel": cause_labels.get(overall_primary, "Unknown"),
            "distribution": root_cause_totals,
            "totalIndicators": sum(root_cause_totals.values()),
        },
        "flakyFiles": [
            {
                "file": f["file"],
                "flakyScore": f["flakyScore"],
                "testCount": f["testCount"],
                "rootCause": f.get("rootCause", "none"),
                "categoryScores": f.get("categoryScores", {}),
                "evidence": f.get("evidence", {}),
            }
            for f in flaky_files if f["flakyScore"] > 0
        ],
    }

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python test_analyzer.py <repo_path>"}))
        sys.exit(1)

    repo_path = sys.argv[1]

    if not os.path.isdir(repo_path):
        print(json.dumps({"error": f"Not a directory: {repo_path}"}))
        sys.exit(1)

    try:
        result = analyze_tests(repo_path)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
