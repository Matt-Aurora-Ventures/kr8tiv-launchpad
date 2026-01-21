#!/bin/bash
#
# K6 Load Test Runner
# KR8TIV Launchpad
#
# Usage:
#   ./run-k6.sh [scenario] [options]
#
# Scenarios:
#   tokens    - Token endpoint tests (default)
#   staking   - Staking endpoint tests
#   launch    - Launch endpoint tests (read-only)
#   stats     - Stats endpoint tests
#   stress    - Stress test (high load)
#   soak      - Soak test (long duration)
#   all       - Run all standard scenarios
#
# Options:
#   --vus N       Override virtual users
#   --duration S  Override test duration
#   --url URL     Override API URL
#   --cloud       Run on k6 Cloud (requires K6_CLOUD_TOKEN)
#   --report      Generate HTML report
#

set -e

# Default configuration
API_URL="${API_URL:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_DIR="$SCRIPT_DIR/k6"
REPORT_DIR="$SCRIPT_DIR/reports"
SCENARIO="${1:-tokens}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed."
        echo ""
        echo "Install k6:"
        echo "  macOS:   brew install k6"
        echo "  Windows: choco install k6"
        echo "  Linux:   https://k6.io/docs/get-started/installation/"
        exit 1
    fi
    log_info "k6 version: $(k6 version)"
}

# Check API health
check_api_health() {
    log_info "Checking API health at $API_URL..."
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        log_success "API is healthy"
    else
        log_warn "API health check failed. Continuing anyway..."
    fi
}

# Parse additional arguments
parse_args() {
    shift # Remove scenario argument
    while [[ $# -gt 0 ]]; do
        case $1 in
            --vus)
                VUS="$2"
                shift 2
                ;;
            --duration)
                DURATION="$2"
                shift 2
                ;;
            --url)
                API_URL="$2"
                shift 2
                ;;
            --cloud)
                CLOUD_RUN=true
                shift
                ;;
            --report)
                GENERATE_REPORT=true
                shift
                ;;
            *)
                log_warn "Unknown option: $1"
                shift
                ;;
        esac
    done
}

# Build k6 command
build_k6_command() {
    local script="$1"
    local cmd="k6 run"

    # Add environment variables
    cmd="$cmd --env API_URL=$API_URL"

    # Add VU override if specified
    if [[ -n "$VUS" ]]; then
        cmd="$cmd --vus $VUS"
    fi

    # Add duration override if specified
    if [[ -n "$DURATION" ]]; then
        cmd="$cmd --duration $DURATION"
    fi

    # Add cloud flag if specified
    if [[ "$CLOUD_RUN" == true ]]; then
        if [[ -z "$K6_CLOUD_TOKEN" ]]; then
            log_error "K6_CLOUD_TOKEN not set. Required for cloud runs."
            exit 1
        fi
        cmd="$cmd --out cloud"
    fi

    # Add JSON output for reports
    if [[ "$GENERATE_REPORT" == true ]]; then
        mkdir -p "$REPORT_DIR"
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local report_file="$REPORT_DIR/k6_${SCENARIO}_${timestamp}.json"
        cmd="$cmd --out json=$report_file"
        log_info "Report will be saved to: $report_file"
    fi

    cmd="$cmd $script"
    echo "$cmd"
}

# Run a single scenario
run_scenario() {
    local name="$1"
    local script="$2"

    echo ""
    log_info "=========================================="
    log_info "Running scenario: $name"
    log_info "=========================================="

    if [[ ! -f "$script" ]]; then
        log_error "Script not found: $script"
        return 1
    fi

    local cmd=$(build_k6_command "$script")
    log_info "Command: $cmd"
    echo ""

    eval "$cmd"

    log_success "Scenario '$name' completed"
}

# Run all standard scenarios
run_all() {
    local scenarios=("tokens" "staking" "launch" "stats")
    for scenario in "${scenarios[@]}"; do
        run_scenario "$scenario" "$K6_DIR/scenarios/${scenario}.js"
    done
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  KR8TIV Launchpad - K6 Load Tests"
    echo "=========================================="
    echo ""

    check_k6
    parse_args "$@"
    check_api_health

    case "$SCENARIO" in
        tokens)
            run_scenario "tokens" "$K6_DIR/scenarios/tokens.js"
            ;;
        staking)
            run_scenario "staking" "$K6_DIR/scenarios/staking.js"
            ;;
        launch)
            run_scenario "launch" "$K6_DIR/scenarios/launch.js"
            ;;
        stats)
            run_scenario "stats" "$K6_DIR/scenarios/stats.js"
            ;;
        stress)
            run_scenario "stress" "$K6_DIR/stress-test.js"
            ;;
        soak)
            log_warn "Soak test runs for ~1 hour. Press Ctrl+C to cancel."
            sleep 3
            run_scenario "soak" "$K6_DIR/soak-test.js"
            ;;
        all)
            run_all
            ;;
        *)
            log_error "Unknown scenario: $SCENARIO"
            echo ""
            echo "Available scenarios: tokens, staking, launch, stats, stress, soak, all"
            exit 1
            ;;
    esac

    echo ""
    log_success "Load tests completed!"
}

main "$@"
