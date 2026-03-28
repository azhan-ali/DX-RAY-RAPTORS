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


def generate_template_patches(score_data, ci_data, repo_path):
    """Generate template-based patches when Gemini is unavailable."""
    patches = []
    patch_id = 1

    if not score_data or "dimensions" not in score_data:
        return patches

    dim_map = {d["id"]: d for d in score_data["dimensions"]}

    # CI/Build patches
    ci_dim = dim_map.get("ci_build")
    if ci_dim and ci_dim["score"] < 70:
        # Check if GitHub Actions exists
        workflows_dir = os.path.join(repo_path, ".github", "workflows")
        has_gha = os.path.isdir(workflows_dir)

        if has_gha:
            patches.append({
                "id": patch_id,
                "title": "Add dependency caching to CI",
                "file": ".github/workflows/ci.yml",
                "language": "yaml",
                "diff": """  steps:
    - uses: actions/checkout@v4
+   - name: Cache node modules
+     uses: actions/cache@v4
+     with:
+       path: ~/.npm
+       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
+       restore-keys: |
+         ${{ runner.os }}-node-
    - uses: actions/setup-node@v4""",
                "impact": "Reduces CI build time by 40-60% on cache hits",
                "confidence": 0.92,
            })
            patch_id += 1
        else:
            patches.append({
                "id": patch_id,
                "title": "Add GitHub Actions CI workflow",
                "file": ".github/workflows/ci.yml",
                "language": "yaml",
                "diff": """+name: CI
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+jobs:
+  build:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: '20'
+          cache: 'npm'
+      - run: npm ci
+      - run: npm test
+      - run: npm run build""",
                "impact": "Adds automated CI pipeline for every push and PR",
                "confidence": 0.95,
            })
            patch_id += 1

    # Test stability patches
    test_dim = dim_map.get("test_stability")
    if test_dim and test_dim["score"] < 60:
        patches.append({
            "id": patch_id,
            "title": "Add flaky test retry configuration",
            "file": "jest.config.js",
            "language": "javascript",
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
        })
        patch_id += 1

    # Code review patches
    review_dim = dim_map.get("code_review")
    if review_dim and review_dim["score"] < 60:
        patches.append({
            "id": patch_id,
            "title": "Add CODEOWNERS for auto-review assignment",
            "file": ".github/CODEOWNERS",
            "language": "markdown",
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
        })
        patch_id += 1

        patches.append({
            "id": patch_id,
            "title": "Add PR template for consistent reviews",
            "file": ".github/pull_request_template.md",
            "language": "markdown",
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
        })
        patch_id += 1

    # Documentation patches
    doc_dim = dim_map.get("doc_freshness")
    if doc_dim and doc_dim["score"] < 50:
        patches.append({
            "id": patch_id,
            "title": "Add documentation freshness check to CI",
            "file": ".github/workflows/doc-check.yml",
            "language": "yaml",
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
        })
        patch_id += 1

    return patches[:5]  # max 5 patches


def generate_ghost_patches(repo_path):
    """Generate DX Ghost patches using Gemini or templates."""

    score_data = run_analyzer("score_engine.py", repo_path)
    ci_data = run_analyzer("ci_parser.py", repo_path)

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

    # Try Gemini first
    gemini_patches = get_gemini_patches(issues, repo_path) if issues else None

    if gemini_patches:
        # Ensure proper IDs
        for i, patch in enumerate(gemini_patches):
            patch["id"] = i + 1
        output = {
            "patches": gemini_patches,
            "source": "gemini",
        }
    else:
        # Fallback to templates
        template_patches = generate_template_patches(score_data, ci_data, repo_path)
        output = {
            "patches": template_patches,
            "source": "template",
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
