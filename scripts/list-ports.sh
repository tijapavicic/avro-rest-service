#!/usr/bin/env bash
#
# list-ports.sh - List all ports used by avro-rest-service
#
# Usage:
#   ./scripts/list-ports.sh
#   ./scripts/list-ports.sh --check    # Check if ports are in use
#   ./scripts/list-ports.sh --docker   # Show Docker port mappings
#

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project ports
PORTS=(
    "3000:Frontend (sim-engine-frontend)"
    "8082:Backend API (sim-engine-backend)"
    "8083:Calculation Engine"
    "8084:Simulation Engine"
    "8085:WebFlux API (large-payload-webflux)"
    "8090:Bulk Import Producer"
    "9092:Kafka (internal)"
    "9093:Kafka (controller)"
    "27017:MongoDB"
    "29092:Kafka (external)"
)

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Avro REST Service - Port Status${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

list_ports() {
    echo -e "${YELLOW}Project Ports:${NC}"
    echo ""
    printf "%-8s %-40s\n" "Port" "Service"
    echo "──────── ────────────────────────────────────────"

    for entry in "${PORTS[@]}"; do
        port="${entry%%:*}"
        service="${entry#*:}"
        printf "%-8s %-40s\n" "$port" "$service"
    done
    echo ""
}

check_ports() {
    echo -e "${YELLOW}Checking Port Status:${NC}"
    echo ""
    printf "%-8s %-40s %-10s %-s\n" "Port" "Service" "Status" "Process"
    echo "──────── ──────────────────────────────────────── ────────── ────────────────────────────"

    for entry in "${PORTS[@]}"; do
        port="${entry%%:*}"
        service="${entry#*:}"

        # Check if port is in use
        if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
            process=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tail -n +2 | awk '{print $1}' | head -n 1)
            echo -e "$(printf '%-8s %-40s' "$port" "$service") ${RED}IN USE${NC}     $process"
        else
            echo -e "$(printf '%-8s %-40s' "$port" "$service") ${GREEN}FREE${NC}       -"
        fi
    done
    echo ""
}

docker_ports() {
    echo -e "${YELLOW}Docker Container Port Mappings:${NC}"
    echo ""

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
        exit 1
    fi

    if ! docker ps >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi

    containers=$(docker ps --filter "name=avro-rest-service" --format "{{.Names}}" 2>/dev/null || true)

    if [ -z "$containers" ]; then
        echo -e "${YELLOW}No running containers found. Start services with:${NC}"
        echo "  docker compose up -d"
        echo ""
        return
    fi

    printf "%-30s %-10s %-s\n" "Container" "Status" "Ports"
    echo "────────────────────────────── ────────── ──────────────────────────────────────────────"

    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v "^NAME" | while IFS=$'\t' read -r name status ports; do
        # Shorten status
        status_short=$(echo "$status" | awk '{print $1}')

        # Color code status
        if [[ "$status_short" == "Up" ]]; then
            status_colored="${GREEN}${status_short}${NC}"
        elif [[ "$status_short" == "Restarting" ]]; then
            status_colored="${YELLOW}${status_short}${NC}"
        else
            status_colored="${RED}${status_short}${NC}"
        fi

        echo -e "$(printf '%-30s' "$name") ${status_colored}     $ports"
    done
    echo ""
}

health_checks() {
    echo -e "${YELLOW}Service Health Checks:${NC}"
    echo ""

    health_endpoints=(
        "8082:Backend:/actuator/health"
        "8085:WebFlux:/actuator/health"
        "8090:Bulk Import:/actuator/health"
    )

    printf "%-12s %-20s %-s\n" "Port" "Service" "Health Status"
    echo "──────────── ──────────────────── ──────────────────────────────"

    for entry in "${health_endpoints[@]}"; do
        port=$(echo "$entry" | cut -d: -f1)
        service=$(echo "$entry" | cut -d: -f2)
        endpoint=$(echo "$entry" | cut -d: -f3)

        url="http://localhost:${port}${endpoint}"

        if response=$(curl -sf "$url" 2>/dev/null); then
            status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "OK")
            if [[ "$status" == "UP" ]] || [[ "$status" == "OK" ]]; then
                echo -e "$(printf '%-12s %-20s' "$port" "$service") ${GREEN}✅ $status${NC}"
            else
                echo -e "$(printf '%-12s %-20s' "$port" "$service") ${YELLOW}⚠️  $status${NC}"
            fi
        else
            echo -e "$(printf '%-12s %-20s' "$port" "$service") ${RED}❌ Not responding${NC}"
        fi
    done
    echo ""
}

usage() {
    cat <<EOF
Usage: $0 [OPTION]

List and check ports used by avro-rest-service.

OPTIONS:
    (no args)       List all project ports
    --check         Check if ports are in use
    --docker        Show Docker container port mappings
    --health        Check service health endpoints
    --all           Show all information
    --help          Display this help message

EXAMPLES:
    $0                  # List all ports
    $0 --check          # Check which ports are in use
    $0 --docker         # Show Docker mappings
    $0 --health         # Check service health
    $0 --all            # Show everything

EOF
}

main() {
    local mode="${1:-list}"

    case "$mode" in
        --check|-c)
            print_header
            check_ports
            ;;
        --docker|-d)
            print_header
            docker_ports
            ;;
        --health|-h)
            print_header
            health_checks
            ;;
        --all|-a)
            print_header
            list_ports
            check_ports
            docker_ports
            health_checks
            ;;
        --help|help)
            usage
            ;;
        list|*)
            print_header
            list_ports
            ;;
    esac
}

main "$@"

