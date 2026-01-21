#!/bin/bash
#
# KR8TIV Launchpad Security Audit Script
#
# Run this script regularly to check for security issues.
# Recommended: Run before each deployment and weekly in CI/CD.
#

set -e

echo "=============================================="
echo "KR8TIV Launchpad Security Audit"
echo "=============================================="
echo "Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
CRITICAL_ISSUES=0
WARNINGS=0

# Function to print status
print_status() {
    if [ "$1" == "OK" ]; then
        echo -e "${GREEN}[OK]${NC} $2"
    elif [ "$1" == "WARN" ]; then
        echo -e "${YELLOW}[WARN]${NC} $2"
        ((WARNINGS++))
    elif [ "$1" == "FAIL" ]; then
        echo -e "${RED}[FAIL]${NC} $2"
        ((CRITICAL_ISSUES++))
    else
        echo "[ ] $2"
    fi
}

echo "----------------------------------------------"
echo "1. Dependency Security Audit"
echo "----------------------------------------------"

# NPM Audit
echo ""
echo "Running npm audit..."
if npm audit --audit-level=critical 2>/dev/null; then
    print_status "OK" "No critical npm vulnerabilities found"
else
    print_status "FAIL" "Critical npm vulnerabilities detected"
    echo "Run 'npm audit' for details"
fi

# Check for outdated packages
echo ""
echo "Checking for outdated packages..."
OUTDATED=$(npm outdated --json 2>/dev/null | wc -l)
if [ "$OUTDATED" -gt 2 ]; then
    print_status "WARN" "Some packages are outdated"
    echo "Run 'npm outdated' for details"
else
    print_status "OK" "Packages are up to date"
fi

echo ""
echo "----------------------------------------------"
echo "2. Environment Configuration Check"
echo "----------------------------------------------"

# Check if .env exists and is in .gitignore
if [ -f ".env" ]; then
    print_status "OK" ".env file exists"
    
    if grep -q "^\.env$" .gitignore 2>/dev/null || grep -q "^\.env\*$" .gitignore 2>/dev/null; then
        print_status "OK" ".env is in .gitignore"
    else
        print_status "FAIL" ".env is NOT in .gitignore - secrets may be committed!"
    fi
else
    print_status "WARN" "No .env file found (using .env.example?)"
fi

# Check for common secret patterns in code
echo ""
echo "Scanning for hardcoded secrets..."
SECRET_PATTERNS="(api_key|apikey|secret|password|private_key|privatekey).*=.*['\"][^'\"]{8,}['\"]"
if grep -riE "$SECRET_PATTERNS" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "example\|sample\|test\|mock" | head -5; then
    print_status "WARN" "Potential hardcoded secrets found - review above"
else
    print_status "OK" "No obvious hardcoded secrets found"
fi

echo ""
echo "----------------------------------------------"
echo "3. Security Headers Check"
echo "----------------------------------------------"

# Check if helmet is installed and used
if grep -q "helmet" package.json 2>/dev/null; then
    print_status "OK" "Helmet security headers package installed"
else
    print_status "FAIL" "Helmet package not found"
fi

if grep -rq "helmet(" src/ --include="*.ts" 2>/dev/null; then
    print_status "OK" "Helmet middleware appears to be configured"
else
    print_status "WARN" "Helmet middleware may not be configured"
fi

echo ""
echo "----------------------------------------------"
echo "4. Rate Limiting Check"
echo "----------------------------------------------"

if grep -q "express-rate-limit" package.json 2>/dev/null; then
    print_status "OK" "Rate limiting package installed"
else
    print_status "FAIL" "Rate limiting package not found"
fi

if grep -rq "rateLimit\|rateLimiter" src/ --include="*.ts" 2>/dev/null; then
    print_status "OK" "Rate limiting appears to be configured"
else
    print_status "WARN" "Rate limiting may not be configured"
fi

echo ""
echo "----------------------------------------------"
echo "5. Input Validation Check"
echo "----------------------------------------------"

if grep -q "zod" package.json 2>/dev/null; then
    print_status "OK" "Zod validation package installed"
else
    print_status "WARN" "Zod validation package not found"
fi

# Check for raw SQL queries
if grep -rE "(raw|execute|query)\s*\(" src/ --include="*.ts" 2>/dev/null | grep -v "prisma\." | head -3; then
    print_status "WARN" "Potential raw SQL queries found - verify they use parameters"
else
    print_status "OK" "No obvious raw SQL queries found"
fi

echo ""
echo "----------------------------------------------"
echo "6. Authentication Check"
echo "----------------------------------------------"

if grep -rq "x-api-key\|authorization\|Bearer" src/ --include="*.ts" 2>/dev/null; then
    print_status "OK" "API key authentication appears configured"
else
    print_status "WARN" "API key authentication may not be configured"
fi

echo ""
echo "----------------------------------------------"
echo "7. TypeScript Security"
echo "----------------------------------------------"

# Check for 'any' types
ANY_COUNT=$(grep -r ": any" src/ --include="*.ts" 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -gt 10 ]; then
    print_status "WARN" "Found $ANY_COUNT 'any' types - consider stricter typing"
else
    print_status "OK" "Minimal use of 'any' type"
fi

# Check for strict mode
if grep -q "\"strict\": true" tsconfig.json 2>/dev/null; then
    print_status "OK" "TypeScript strict mode enabled"
else
    print_status "WARN" "TypeScript strict mode not enabled"
fi

echo ""
echo "=============================================="
echo "Security Audit Summary"
echo "=============================================="
echo -e "Critical Issues: ${RED}$CRITICAL_ISSUES${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}SECURITY AUDIT FAILED${NC}"
    echo "Address critical issues before deploying to production."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}SECURITY AUDIT PASSED WITH WARNINGS${NC}"
    echo "Review warnings and address if applicable."
    exit 0
else
    echo -e "${GREEN}SECURITY AUDIT PASSED${NC}"
    echo "All checks passed."
    exit 0
fi
