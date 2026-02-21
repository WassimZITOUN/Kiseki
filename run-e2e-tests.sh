#!/bin/bash

# ============================================================
# Kiseki E2E Tests - Quick Runner Script
# ============================================================
#
# Usage:
#   ./run-e2e-tests.sh              # Run all tests
#   ./run-e2e-tests.sh --ui         # Run with UI
#   ./run-e2e-tests.sh --watch      # Run in watch mode
#   ./run-e2e-tests.sh --coverage   # Run with coverage
#
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Kiseki E2E Tests - Quick Runner               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Supabase local is not running!${NC}"
    echo -e "${YELLOW}   Start it with: supabase start${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Supabase is running${NC}"
echo ""

# Check if dependencies are installed
if [ ! -d "packages/tests/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    cd packages/tests
    npm install
    cd ../..
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Parse arguments
MODE="test"
if [ "$1" == "--ui" ]; then
    MODE="test:ui"
elif [ "$1" == "--watch" ]; then
    MODE="test:watch"
elif [ "$1" == "--coverage" ]; then
    MODE="test -- --coverage"
fi

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
echo ""
cd packages/tests
npm run $MODE

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"
