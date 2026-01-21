#!/bin/bash
#
# PRE-UPDATE VALIDATION SCRIPT
# Run this BEFORE making any code changes to ray3.html
#
# Usage: ./tests/validate.sh
#

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🔒 PRE-UPDATE VALIDATION                                 ║"
echo "║  Running automated tests before code changes...           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install Node.js first: https://nodejs.org/"
    exit 1
fi

# Run the test suite
cd "$(dirname "$0")/.."
node tests/run_tests.js

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ✅ VALIDATION PASSED                                     ║"
    echo "║  You may proceed with code changes                        ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    exit 0
else
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ❌ VALIDATION FAILED                                     ║"
    echo "║  Fix the issues above before making changes               ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
fi
