#!/bin/bash
# DevPulse Setup Script
# One-command setup for the entire project

set -e

echo "╔══════════════════════════════════════╗"
echo "║       DevPulse — Setup Script        ║"
echo "║     Repository Health X-Ray          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "▶ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Install from https://nodejs.org"
    exit 1
fi
echo "  ✓ Node.js $(node --version)"

if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "✗ Python not found. Install from https://python.org"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
echo "  ✓ Python $($PYTHON_CMD --version 2>&1 | awk '{print $2}')"

if ! command -v git &> /dev/null; then
    echo "✗ Git not found. Install from https://git-scm.com"
    exit 1
fi
echo "  ✓ Git $(git --version | awk '{print $3}')"

echo ""

# Install Python dependencies
echo "▶ Installing Python dependencies..."
cd analyzers
$PYTHON_CMD -m pip install -r requirements.txt --quiet 2>/dev/null || {
    echo "  ⚠ Some Python packages failed to install (optional: numpy, scipy, google-generativeai)"
    echo "  The tool will work with template-based fallbacks."
}
cd ..
echo "  ✓ Python dependencies ready"

echo ""

# Install Node.js dependencies
echo "▶ Installing Node.js dependencies..."
cd devpulse
npm install --silent 2>/dev/null
echo "  ✓ Node.js dependencies ready"

echo ""

# Optional: Set Gemini API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo "▶ Gemini API key not set (optional)"
    echo "  DX Ghost will use template-based patches."
    echo "  To enable AI patches: export GEMINI_API_KEY=your_key"
    echo ""
fi

# Start the dev server
echo "╔══════════════════════════════════════╗"
echo "║          Setup Complete! ✓           ║"
echo "╠══════════════════════════════════════╣"
echo "║  To start:                           ║"
echo "║    cd devpulse && npm run dev        ║"
echo "║                                      ║"
echo "║  Then open http://localhost:3000     ║"
echo "╚══════════════════════════════════════╝"
