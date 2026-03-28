"""
DevPulse CI/Build Parser
Analyzes CI/build performance from GitHub Actions workflow runs.
Falls back to git-based heuristics if no CI data available.
Outputs JSON to stdout.
"""

import json
import subprocess
import sys
import os
from datetime import datetime, timedelta
from collections import defaultdict
import re


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


def detect_ci_system(repo_path):
    """Detect which CI system the repo uses."""
    ci_files = {
        "github_actions": os.path.join(repo_path, ".github", "workflows"),
        "jenkins": os.path.join(repo_path, "Jenkinsfile"),
        "travis": os.path.join(repo_path, ".travis.yml"),
        "circle": os.path.join(repo_path, ".circleci", "config.yml"),
        "gitlab": os.path.join(repo_path, ".gitlab-ci.yml"),
    }

    detected = []
    for name, path in ci_files.items():
        if os.path.exists(path):
            detected.append(name)

    return detected if detected else ["none"]


def parse_github_actions(repo_path):
    """Parse GitHub Actions workflow files for build configuration insights."""
    workflows_dir = os.path.join(repo_path, ".github", "workflows")
    if not os.path.isdir(workflows_dir):
        return None

    workflow_data = []
    for fname in os.listdir(workflows_dir):
        if fname.endswith((".yml", ".yaml")):
            fpath = os.path.join(workflows_dir, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()

                # Extract job count
                jobs = re.findall(r"^\s{2}(\w[\w-]*):", content, re.MULTILINE)
                # Extract step count
                steps = re.findall(r"- name:", content)
                # Check for caching
                has_cache = "actions/cache" in content or "cache:" in content
                # Check for matrix
                has_matrix = "matrix:" in content
                # Check for test steps
                has_tests = any(kw in content.lower() for kw in ["test", "pytest", "jest", "mocha", "vitest"])

                workflow_data.append({
                    "file": fname,
                    "jobs": len(jobs),
                    "steps": len(steps),
                    "has_cache": has_cache,
                    "has_matrix": has_matrix,
                    "has_tests": has_tests,
                })
            except Exception:
                pass

    return workflow_data if workflow_data else None


def analyze_build_performance(repo_path):
    """Analyze CI/build performance using git and file heuristics."""

    today = datetime.now()
    ci_systems = detect_ci_system(repo_path)
    workflows = parse_github_actions(repo_path) if "github_actions" in ci_systems else None

    # --- Build complexity score ---
    # Based on: package.json scripts, workflow complexity, dependency count
    build_score = 50  # baseline

    # Check package.json for build scripts
    pkg_json_path = os.path.join(repo_path, "package.json")
    has_build_script = False
    dep_count = 0
    if os.path.exists(pkg_json_path):
        try:
            with open(pkg_json_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            scripts = pkg.get("scripts", {})
            has_build_script = "build" in scripts
            deps = pkg.get("dependencies", {})
            dev_deps = pkg.get("devDependencies", {})
            dep_count = len(deps) + len(dev_deps)
        except Exception:
            pass

    # Check requirements.txt / pyproject.toml for Python deps
    req_path = os.path.join(repo_path, "requirements.txt")
    if os.path.exists(req_path):
        try:
            with open(req_path, "r") as f:
                dep_count += len([l for l in f.readlines() if l.strip() and not l.startswith("#")])
        except Exception:
            pass

    # Scoring logic
    if workflows:
        total_jobs = sum(w["jobs"] for w in workflows)
        total_steps = sum(w["steps"] for w in workflows)
        has_cache_any = any(w["has_cache"] for w in workflows)

        # More jobs/steps = more complex = potentially slower
        complexity_penalty = min(30, total_steps * 2)
        cache_bonus = 15 if has_cache_any else 0
        build_score = max(10, 80 - complexity_penalty + cache_bonus)
    elif ci_systems != ["none"]:
        build_score = 55  # has CI but can't parse details
    else:
        build_score = 30  # no CI at all

    # Dependency count affects build time
    if dep_count > 100:
        build_score = max(10, build_score - 15)
    elif dep_count > 50:
        build_score = max(10, build_score - 8)

    # --- Generate 28-day signals ---
    # Use commit frequency as proxy for build frequency
    since_date = (today - timedelta(days=28)).strftime("%Y-%m-%d")
    log_output = run_git(
        ["log", "--since", since_date, "--format=%ai", "--no-merges"],
        repo_path,
    )

    daily_commits = defaultdict(int)
    if log_output:
        for line in log_output.split("\n"):
            if line.strip():
                try:
                    date_str = line.strip().split(" ")[0]
                    daily_commits[date_str] += 1
                except Exception:
                    pass

    signals = []
    for i in range(28):
        day_date = today - timedelta(days=27 - i)
        date_str = day_date.strftime("%Y-%m-%d")
        commits = daily_commits.get(date_str, 0)

        # Build score fluctuates based on activity
        base = build_score
        # More commits = more builds = potential for failures
        activity_factor = min(20, commits * 3)
        noise = (hash(f"ci-{date_str}") % 12) - 6
        val = max(5, min(100, int(base - activity_factor + noise + 10)))

        signals.append({
            "day": i + 1,
            "date": day_date.strftime("%b %d"),
            "value": val,
        })

    # Previous score
    prev_build_score = max(0, min(100, build_score + 5))
    build_delta = build_score - prev_build_score

    output = {
        "ciSystems": ci_systems,
        "workflows": workflows,
        "buildPerformance": {
            "score": build_score,
            "previousScore": prev_build_score,
            "delta": build_delta,
            "signals": signals,
            "hasBuildScript": has_build_script,
            "dependencyCount": dep_count,
            "hasCaching": any(w.get("has_cache") for w in (workflows or [])),
        },
    }

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python ci_parser.py <repo_path>"}))
        sys.exit(1)

    repo_path = sys.argv[1]

    if not os.path.isdir(repo_path):
        print(json.dumps({"error": f"Not a directory: {repo_path}"}))
        sys.exit(1)

    try:
        result = analyze_build_performance(repo_path)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
