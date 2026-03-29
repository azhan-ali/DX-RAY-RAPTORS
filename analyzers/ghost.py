"""
DevPulse DX Ghost — AI Patch Writer
Uses Google Gemini API to generate fix suggestions based on detected issues.
Falls back to template-based patches if API is unavailable.
Outputs JSON to stdout.
"""

import json
import subprocess
import sys
import os


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


def get_gemini_patches(issues, repo_path):
    """Use Gemini API to generate patches for detected issues."""
    try:
        import google.generativeai as genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""You are DevPulse DX Ghost, an AI that generates code patches to fix developer experience issues in repositories.

Repository: {os.path.basename(repo_path)}

Detected issues:
{json.dumps(issues, indent=2)}

For each issue, generate a concrete code fix as a unified diff. Focus on:
1. CI/Build: caching, parallelization, optimization
2. Tests: flaky test fixes, retry logic, proper teardown
3. Code Review: CODEOWNERS file, PR templates
4. Documentation: README updates, missing docs

Return ONLY valid JSON array with this structure:
[
  {{
    "id": 1,
    "title": "Short fix title",
    "file": "path/to/file",
    "language": "yaml|python|javascript|markdown",
    "diff": "unified diff with + and - lines",
    "impact": "Brief impact description",
    "confidence": 0.85
  }}
]

Generate 3-5 patches. Be specific and practical."""

        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON from response
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        patches = json.loads(text)
        return patches

    except ImportError:
        return None
    except Exception as e:
        print(f"Warning: Gemini API failed: {e}", file=sys.stderr)
        return None


def deep_parse_ci_yaml(repo_path):
    """Deep parse actual CI YAML files to understand pipeline structure."""
    import re

    workflows_dir = os.path.join(repo_path, ".github", "workflows")
    ci_analysis = {
        "hasCI": False,
        "workflows": [],
        "issues": [],
        "totalJobs": 0,
        "totalSteps": 0,
        "hasCaching": False,
        "hasMatrix": False,
        "hasTests": False,
        "hasLinting": False,
        "hasDeploy": False,
        "estimatedBuildMinutes": 5,
    }

    if not os.path.isdir(workflows_dir):
        # Check other CI systems
        for ci_file, ci_name in [
            ("Jenkinsfile", "Jenkins"),
            (".travis.yml", "Travis CI"),
            (".circleci/config.yml", "CircleCI"),
            (".gitlab-ci.yml", "GitLab CI"),
        ]:
            if os.path.exists(os.path.join(repo_path, ci_file)):
                ci_analysis["hasCI"] = True
                ci_analysis["workflows"].append({"file": ci_file, "system": ci_name})
        return ci_analysis

    ci_analysis["hasCI"] = True

    for fname in os.listdir(workflows_dir):
        if not fname.endswith((".yml", ".yaml")):
            continue
        fpath = os.path.join(workflows_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            wf = {"file": fname, "system": "GitHub Actions", "issues": []}

            # Parse triggers
            triggers = re.findall(r"on:\s*\n((?:\s+.+\n)*)", content)
            has_push = "push:" in content
            has_pr = "pull_request:" in content
            has_schedule = "schedule:" in content

            # Parse jobs
            job_names = re.findall(r"^\s{2}([\w-]+):\s*$", content, re.MULTILINE)
            steps = re.findall(r"-\s+(?:name|uses):", content)
            wf["jobs"] = len(job_names)
            wf["steps"] = len(steps)
            ci_analysis["totalJobs"] += len(job_names)
            ci_analysis["totalSteps"] += len(steps)

            # Check for optimizations
            has_cache = "actions/cache" in content or "cache:" in content
            has_matrix = "matrix:" in content
            has_concurrency = "concurrency:" in content
            has_timeout = "timeout-minutes:" in content
            has_artifacts = "actions/upload-artifact" in content

            if has_cache:
                ci_analysis["hasCaching"] = True
            if has_matrix:
                ci_analysis["hasMatrix"] = True

            # Check for test/lint/deploy steps
            content_lower = content.lower()
            if any(kw in content_lower for kw in ["test", "pytest", "jest", "mocha", "vitest", "npm test"]):
                ci_analysis["hasTests"] = True
            if any(kw in content_lower for kw in ["lint", "eslint", "flake8", "pylint", "rubocop"]):
                ci_analysis["hasLinting"] = True
            if any(kw in content_lower for kw in ["deploy", "publish", "release"]):
                ci_analysis["hasDeploy"] = True

            # Detect issues in this workflow
            if not has_cache:
                wf["issues"].append({
                    "type": "no_caching",
                    "severity": "high",
                    "description": f"{fname}: No dependency caching configured — builds download deps every time",
                    "estimatedTimeSaved": "2-5 min per build",
                })
            if not has_concurrency:
                wf["issues"].append({
                    "type": "no_concurrency",
                    "severity": "medium",
                    "description": f"{fname}: No concurrency limits — duplicate builds may run simultaneously",
                    "estimatedTimeSaved": "Prevents wasted runner minutes",
                })
            if not has_timeout:
                wf["issues"].append({
                    "type": "no_timeout",
                    "severity": "medium",
                    "description": f"{fname}: No timeout-minutes set — hung jobs can waste runner quota",
                    "estimatedTimeSaved": "Prevents 6hr max timeout waste",
                })
            if len(steps) > 15 and not has_matrix:
                wf["issues"].append({
                    "type": "no_parallelization",
                    "severity": "high",
                    "description": f"{fname}: {len(steps)} steps in serial — consider matrix strategy or splitting jobs",
                    "estimatedTimeSaved": "30-60% with parallelization",
                })
            if has_push and has_pr and not has_concurrency:
                wf["issues"].append({
                    "type": "duplicate_runs",
                    "severity": "low",
                    "description": f"{fname}: Triggers on both push and PR — may cause duplicate runs on same commit",
                    "estimatedTimeSaved": "50% fewer CI runs",
                })

            ci_analysis["workflows"].append(wf)
            ci_analysis["issues"].extend(wf["issues"])

        except Exception:
            pass

    # Estimate build time based on complexity
    ci_analysis["estimatedBuildMinutes"] = max(1, ci_analysis["totalSteps"] * 0.5)

    return ci_analysis


def simulate_patch_outcome(patch, ci_analysis, dim_map):
    """Simulate the outcome of applying a patch — estimates before/after metrics."""
    outcome = {
        "applied": False,
        "beforeMetrics": {},
        "afterMetrics": {},
        "estimatedImprovement": "",
        "riskLevel": "low",
    }

    patch_type = patch.get("patchType", "")

    if patch_type == "ci_caching":
        build_min = ci_analysis.get("estimatedBuildMinutes", 5)
        outcome["beforeMetrics"] = {"buildTime": f"{build_min:.1f} min", "cacheHitRate": "0%"}
        after_min = build_min * 0.45
        outcome["afterMetrics"] = {"buildTime": f"{after_min:.1f} min", "cacheHitRate": "~85%"}
        outcome["estimatedImprovement"] = f"Build time: {build_min:.1f}min → {after_min:.1f}min (-{int((1 - after_min/build_min)*100)}%)"
        outcome["riskLevel"] = "low"

    elif patch_type == "ci_concurrency":
        outcome["beforeMetrics"] = {"duplicateRuns": "~30% of builds", "wastedMinutes": "~15 min/week"}
        outcome["afterMetrics"] = {"duplicateRuns": "0%", "wastedMinutes": "0 min/week"}
        outcome["estimatedImprovement"] = "Eliminates duplicate CI runs, saves ~15 runner-minutes/week"
        outcome["riskLevel"] = "low"

    elif patch_type == "ci_timeout":
        outcome["beforeMetrics"] = {"maxHangTime": "6 hours (GitHub default)", "riskOfWaste": "High"}
        outcome["afterMetrics"] = {"maxHangTime": "15 minutes", "riskOfWaste": "None"}
        outcome["estimatedImprovement"] = "Prevents hung jobs from consuming 6hrs of runner quota"
        outcome["riskLevel"] = "low"

    elif patch_type == "test_retry":
        test_dim = dim_map.get("test_stability")
        flaky_rate = (100 - test_dim["score"]) if test_dim else 20
        outcome["beforeMetrics"] = {"falseFailureRate": f"~{flaky_rate}%", "devTimeWasted": f"~{flaky_rate * 0.3:.0f} hrs/month"}
        outcome["afterMetrics"] = {"falseFailureRate": f"~{max(2, flaky_rate * 0.2):.0f}%", "devTimeWasted": f"~{flaky_rate * 0.06:.0f} hrs/month"}
        outcome["estimatedImprovement"] = f"False failures: {flaky_rate}% → {max(2, flaky_rate * 0.2):.0f}% (~80% reduction)"
        outcome["riskLevel"] = "low"

    elif patch_type == "codeowners":
        review_dim = dim_map.get("code_review")
        review_hrs = (48 - review_dim["score"] * 0.4) if review_dim else 24
        outcome["beforeMetrics"] = {"avgReviewWait": f"{review_hrs:.0f} hrs", "unassignedPRs": "~40%"}
        outcome["afterMetrics"] = {"avgReviewWait": f"{review_hrs * 0.5:.0f} hrs", "unassignedPRs": "0%"}
        outcome["estimatedImprovement"] = f"Review wait: {review_hrs:.0f}hrs → {review_hrs * 0.5:.0f}hrs (-50%)"
        outcome["riskLevel"] = "low"

    elif patch_type == "pr_template":
        outcome["beforeMetrics"] = {"prDescriptionQuality": "Inconsistent", "reviewRoundTrips": "~3"}
        outcome["afterMetrics"] = {"prDescriptionQuality": "Standardized", "reviewRoundTrips": "~1.5"}
        outcome["estimatedImprovement"] = "Review round-trips reduced by ~50% with structured PR descriptions"
        outcome["riskLevel"] = "low"

    elif patch_type == "doc_check":
        doc_dim = dim_map.get("doc_freshness")
        stale = (100 - doc_dim["score"]) if doc_dim else 50
        outcome["beforeMetrics"] = {"staleDocs": f"~{stale}%", "docAlerts": "None"}
        outcome["afterMetrics"] = {"staleDocs": f"~{max(5, stale * 0.4):.0f}%", "docAlerts": "Weekly"}
        outcome["estimatedImprovement"] = f"Stale docs: {stale}% → {max(5, stale * 0.4):.0f}% with weekly monitoring"
        outcome["riskLevel"] = "low"

    else:
        outcome["estimatedImprovement"] = "Improvement estimated based on industry benchmarks"
        outcome["riskLevel"] = "low"

    return outcome


def generate_template_patches(score_data, ci_data, repo_path):
    """Generate template-based patches with deep CI analysis and outcome simulation."""
    patches = []
    patch_id = 1

    if not score_data or "dimensions" not in score_data:
        return patches

    dim_map = {d["id"]: d for d in score_data["dimensions"]}
    ci_analysis = deep_parse_ci_yaml(repo_path)

    # CI/Build patches — based on actual CI YAML issues
    ci_dim = dim_map.get("ci_build")

    if ci_analysis["hasCI"]:
        # Check actual issues found in CI YAML
        for issue in ci_analysis.get("issues", []):
            if issue["type"] == "no_caching" and patch_id <= 6:
                wf_file = issue["description"].split(":")[0]
                patch = {
                    "id": patch_id,
                    "title": f"Add dependency caching to {wf_file}",
                    "file": f".github/workflows/{wf_file}",
                    "language": "yaml",
                    "patchType": "ci_caching",
                    "diff": """  steps:
    - uses: actions/checkout@v4
+   - name: Cache dependencies
+     uses: actions/cache@v4
+     with:
+       path: |
+         ~/.npm
+         ~/.cache/pip
+         node_modules
+       key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
+       restore-keys: |
+         ${{ runner.os }}-deps-""",
                    "impact": issue["estimatedTimeSaved"],
                    "confidence": 0.92,
                    "sourceIssue": issue,
                }
                patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
                patches.append(patch)
                patch_id += 1

            elif issue["type"] == "no_concurrency" and patch_id <= 6:
                wf_file = issue["description"].split(":")[0]
                patch = {
                    "id": patch_id,
                    "title": f"Add concurrency control to {wf_file}",
                    "file": f".github/workflows/{wf_file}",
                    "language": "yaml",
                    "patchType": "ci_concurrency",
                    "diff": f"""+concurrency:
+  group: ${{{{ github.workflow }}}}-${{{{ github.ref }}}}
+  cancel-in-progress: true
+
 name:""",
                    "impact": issue["estimatedTimeSaved"],
                    "confidence": 0.88,
                    "sourceIssue": issue,
                }
                patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
                patches.append(patch)
                patch_id += 1

            elif issue["type"] == "no_timeout" and patch_id <= 6:
                wf_file = issue["description"].split(":")[0]
                patch = {
                    "id": patch_id,
                    "title": f"Add job timeout to {wf_file}",
                    "file": f".github/workflows/{wf_file}",
                    "language": "yaml",
                    "patchType": "ci_timeout",
                    "diff": """  build:
    runs-on: ubuntu-latest
+   timeout-minutes: 15""",
                    "impact": issue["estimatedTimeSaved"],
                    "confidence": 0.95,
                    "sourceIssue": issue,
                }
                patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
                patches.append(patch)
                patch_id += 1

    elif ci_dim and ci_dim["score"] < 70:
        # No CI at all — suggest adding GitHub Actions
        patch = {
            "id": patch_id,
            "title": "Add GitHub Actions CI workflow",
            "file": ".github/workflows/ci.yml",
            "language": "yaml",
            "patchType": "ci_new",
            "diff": """+name: CI
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+concurrency:
+  group: ${{ github.workflow }}-${{ github.ref }}
+  cancel-in-progress: true
+
+jobs:
+  build:
+    runs-on: ubuntu-latest
+    timeout-minutes: 15
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: '20'
+          cache: 'npm'
+      - run: npm ci
+      - run: npm test
+      - run: npm run build""",
            "impact": "Adds automated CI pipeline with caching, concurrency control, and timeout",
            "confidence": 0.95,
        }
        patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
        patches.append(patch)
        patch_id += 1

    # Test stability patches
    test_dim = dim_map.get("test_stability")
    if test_dim and test_dim["score"] < 60 and patch_id <= 6:
        patch = {
            "id": patch_id,
            "title": "Add flaky test retry configuration",
            "file": "jest.config.js",
            "language": "javascript",
            "patchType": "test_retry",
            "diff": """ module.exports = {
+  // Retry flaky tests up to 2 times
+  retryTimes: 2,
+  // Increase test timeout for CI environments
+  testTimeout: process.env.CI ? 30000 : 10000,
+  // Run tests in band on CI to avoid resource contention
+  ...(process.env.CI && { maxWorkers: 1 }),
 };""",
            "impact": "Reduces false failures from flaky tests by ~80%",
            "confidence": 0.88,
        }
        patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
        patches.append(patch)
        patch_id += 1

    # Code review patches
    review_dim = dim_map.get("code_review")
    if review_dim and review_dim["score"] < 60 and patch_id <= 6:
        patch = {
            "id": patch_id,
            "title": "Add CODEOWNERS for auto-review assignment",
            "file": ".github/CODEOWNERS",
            "language": "markdown",
            "patchType": "codeowners",
            "diff": """+# Default reviewers for all files
+* @team-lead @senior-dev
+
+# Frontend changes
+/src/components/** @frontend-team
+/src/app/** @frontend-team
+
+# CI/Build changes
+/.github/** @devops-team
+/Dockerfile @devops-team
+
+# Documentation
+/docs/** @tech-writer @team-lead
+*.md @tech-writer""",
            "impact": "Auto-assigns reviewers, reducing review wait time by 50%",
            "confidence": 0.90,
        }
        patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
        patches.append(patch)
        patch_id += 1

        if patch_id <= 6:
            patch2 = {
                "id": patch_id,
                "title": "Add PR template for consistent reviews",
                "file": ".github/pull_request_template.md",
                "language": "markdown",
                "patchType": "pr_template",
                "diff": """+## What does this PR do?
+<!-- Brief description -->
+
+## Type of change
+- [ ] Bug fix
+- [ ] New feature
+- [ ] Breaking change
+- [ ] Documentation update
+
+## Testing
+- [ ] Unit tests pass
+- [ ] Manual testing done
+
+## Checklist
+- [ ] Code follows project conventions
+- [ ] Self-reviewed my changes
+- [ ] Updated relevant documentation""",
                "impact": "Standardizes PR descriptions, speeds up review process",
                "confidence": 0.85,
            }
            patch2["simulatedOutcome"] = simulate_patch_outcome(patch2, ci_analysis, dim_map)
            patches.append(patch2)
            patch_id += 1

    # Documentation patches
    doc_dim = dim_map.get("doc_freshness")
    if doc_dim and doc_dim["score"] < 50 and patch_id <= 6:
        patch = {
            "id": patch_id,
            "title": "Add documentation freshness check to CI",
            "file": ".github/workflows/doc-check.yml",
            "language": "yaml",
            "patchType": "doc_check",
            "diff": """+name: Doc Freshness Check
+on:
+  schedule:
+    - cron: '0 9 * * 1'  # Every Monday
+  workflow_dispatch:
+
+jobs:
+  check-docs:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+        with:
+          fetch-depth: 0
+      - name: Check stale docs
+        run: |
+          echo "Files not updated in 30+ days:"
+          find docs/ -name "*.md" -mtime +30 -print
+          find . -maxdepth 1 -name "*.md" -mtime +30 -print""",
            "impact": "Weekly alerts for stale documentation",
            "confidence": 0.82,
        }
        patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
        patches.append(patch)
        patch_id += 1

    return patches[:6]  # max 6 patches


def generate_ghost_patches(repo_path):
    """Generate DX Ghost patches using Gemini or templates, with deep CI analysis."""

    score_data = run_analyzer("score_engine.py", repo_path)
    ci_data = run_analyzer("ci_parser.py", repo_path)

    # Deep parse CI YAML files
    ci_analysis = deep_parse_ci_yaml(repo_path)

    # Build issues list for Gemini
    issues = []
    if score_data and "dimensions" in score_data:
        for dim in score_data["dimensions"]:
            if dim["score"] < 70:
                issues.append({
                    "dimension": dim["shortName"],
                    "score": dim["score"],
                    "status": dim["status"],
                    "description": dim["description"],
                })

    # Add CI-specific issues for more context
    for ci_issue in ci_analysis.get("issues", []):
        issues.append({
            "dimension": "CI/Build",
            "score": 0,
            "status": "issue",
            "description": ci_issue["description"],
        })

    # Try Gemini first
    gemini_patches = get_gemini_patches(issues, repo_path) if issues else None

    if gemini_patches:
        # Ensure proper IDs and add simulation
        dim_map = {d["id"]: d for d in score_data["dimensions"]} if score_data else {}
        for i, patch in enumerate(gemini_patches):
            patch["id"] = i + 1
            patch["simulatedOutcome"] = simulate_patch_outcome(patch, ci_analysis, dim_map)
        output = {
            "patches": gemini_patches,
            "source": "gemini",
            "ciAnalysis": {
                "hasCI": ci_analysis["hasCI"],
                "systems": [w.get("system", "unknown") for w in ci_analysis["workflows"]],
                "issuesFound": len(ci_analysis["issues"]),
                "hasCaching": ci_analysis["hasCaching"],
                "hasMatrix": ci_analysis["hasMatrix"],
                "estimatedBuildMin": ci_analysis["estimatedBuildMinutes"],
            },
        }
    else:
        # Fallback to templates
        template_patches = generate_template_patches(score_data, ci_data, repo_path)
        output = {
            "patches": template_patches,
            "source": "template",
            "ciAnalysis": {
                "hasCI": ci_analysis["hasCI"],
                "systems": [w.get("system", "unknown") for w in ci_analysis["workflows"]],
                "issuesFound": len(ci_analysis["issues"]),
                "hasCaching": ci_analysis["hasCaching"],
                "hasMatrix": ci_analysis["hasMatrix"],
                "estimatedBuildMin": ci_analysis["estimatedBuildMinutes"],
            },
        }

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python ghost.py <repo_path>"}))
        sys.exit(1)

    repo_path = sys.argv[1]

    if not os.path.isdir(repo_path):
        print(json.dumps({"error": f"Not a directory: {repo_path}"}))
        sys.exit(1)

    try:
        result = generate_ghost_patches(repo_path)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
