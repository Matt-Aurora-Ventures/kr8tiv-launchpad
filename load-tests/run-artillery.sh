#!/bin/bash
#
# Artillery Load Test Runner
# KR8TIV Launchpad
#
# Usage:
#   ./run-artillery.sh [config] [options]
#
# Configs:
#   standard  - Standard load test (default)
#   stress    - Stress test (high load)
#
# Options:
#   --target URL    Override target URL
#   --output FILE   Output report to file
#   --quiet         Suppress output
#

set -e

# Default configuration
TARGET="${TARGET:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARTILLERY_DIR="$SCRIPT_DIR/artillery"
REPORT_DIR="$SCRIPT_DIR/reports"
CONFIG="${1:-standard}"

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

# Check if artillery is installed
check_artillery() {
    if ! command -v npx &> /dev/null; then
        log_error "npx is not available. Install Node.js first."
        exit 1
    fi

    # Check if artillery is available (will be installed via npx if needed)
    log_info "Using artillery via npx..."
}

# Check API health
check_api_health() {
    log_info "Checking API health at $TARGET..."
    if curl -s -f "$TARGET/health" > /dev/null 2>&1; then
        log_success "API is healthy"
    else
        log_warn "API health check failed. Continuing anyway..."
    fi
}

# Parse additional arguments
QUIET=""
OUTPUT_FILE=""

parse_args() {
    shift # Remove config argument
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target)
                TARGET="$2"
                shift 2
                ;;
            --output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --quiet)
                QUIET="--quiet"
                shift
                ;;
            *)
                log_warn "Unknown option: $1"
                shift
                ;;
        esac
    done
}

# Run artillery test
run_test() {
    local name="$1"
    local config_file="$2"

    echo ""
    log_info "=========================================="
    log_info "Running Artillery test: $name"
    log_info "=========================================="

    if [[ ! -f "$config_file" ]]; then
        log_error "Config not found: $config_file"
        return 1
    fi

    # Build command
    local cmd="npx artillery run"

    # Add target override
    cmd="$cmd --target $TARGET"

    # Add quiet flag if specified
    if [[ -n "$QUIET" ]]; then
        cmd="$cmd $QUIET"
    fi

    # Add output file if specified
    if [[ -n "$OUTPUT_FILE" ]]; then
        mkdir -p "$REPORT_DIR"
        cmd="$cmd --output $REPORT_DIR/$OUTPUT_FILE"
        log_info "Report will be saved to: $REPORT_DIR/$OUTPUT_FILE"
    fi

    cmd="$cmd $config_file"

    log_info "Command: $cmd"
    echo ""

    eval "$cmd"

    # Generate HTML report if JSON output was created
    if [[ -n "$OUTPUT_FILE" && -f "$REPORT_DIR/$OUTPUT_FILE" ]]; then
        local html_file="${OUTPUT_FILE%.json}.html"
        log_info "Generating HTML report..."
        npx artillery report "$REPORT_DIR/$OUTPUT_FILE" --output "$REPORT_DIR/$html_file" 2>/dev/null || true
        if [[ -f "$REPORT_DIR/$html_file" ]]; then
            log_success "HTML report: $REPORT_DIR/$html_file"
        fi
    fi

    log_success "Test '$name' completed"
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  KR8TIV Launchpad - Artillery Tests"
    echo "=========================================="
    echo ""

    check_artillery
    parse_args "$@"
    check_api_health

    case "$CONFIG" in
        standard|config)
            run_test "Standard Load Test" "$ARTILLERY_DIR/config.yml"
            ;;
        stress)
            run_test "Stress Test" "$ARTILLERY_DIR/stress.yml"
            ;;
        *)
            log_error "Unknown config: $CONFIG"
            echo ""
            echo "Available configs: standard, stress"
            exit 1
            ;;
    esac

    echo ""
    log_success "Artillery tests completed!"
}

main "$@"
