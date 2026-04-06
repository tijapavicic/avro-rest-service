# Port Configuration Reference

This document lists all ports used by services in this project.

## Quick Start

**Use the automated port checker script:**
```bash
# List all ports
./scripts/list-ports.sh

# Check which ports are in use
./scripts/list-ports.sh --check

# Show Docker container mappings
./scripts/list-ports.sh --docker

# Check service health
./scripts/list-ports.sh --health

# Show everything
./scripts/list-ports.sh --all
```

## Table of Contents

- [Application Services](#application-services)
- [Infrastructure Services](#infrastructure-services)
- [Environment Variable Overrides](#environment-variable-overrides)
- [Quick Reference Table](#quick-reference-table)
- [Bash Commands for Port Management](#bash-commands-for-port-management)
- [Port Conflict Resolution](#port-conflict-resolution)
- [Network Diagram](#network-diagram)
- [Notes](#notes)

## Application Services

### Frontend
- **Port**: `3000`
- **Service**: `sim-engine-frontend`
- **Protocol**: HTTP
- **Description**: Static web UI for simulation dashboard, analytics, and settings
- **Config Source**: Docker Compose default
- **Override Variable**: `FRONTEND_PORT`

### Backend API
- **Port**: `8082`
- **Service**: `sim-engine-backend`
- **Protocol**: HTTP
- **Description**: Main REST API for simulations (`POST /api/simulations`, `/api/payloads/*`)
- **Config Source**: `sim-engine-backend/src/main/resources/application.properties`
- **Override Variable**: `BACKEND_PORT`
- **Endpoints**:
  - `POST /api/simulations`
  - `POST /api/payloads/ingest-gzip`
  - `POST /api/payloads/ingest-ndjson`
  - `GET /actuator/health`
  - `GET /actuator/info`

### Calculation Engine
- **Port**: `8083`
- **Service**: `calculation-engine`
- **Protocol**: HTTP
- **Description**: Worker service for calculation processing (scaffold, no public endpoints yet)
- **Config Source**: Docker Compose environment variable
- **Override Variable**: `CALCULATION_PORT`

### Simulation Engine
- **Port**: `8084`
- **Service**: `simulation-engine`
- **Protocol**: HTTP
- **Description**: Worker service for simulation processing (scaffold, no public endpoints yet)
- **Config Source**: Docker Compose environment variable
- **Override Variable**: `SIMULATION_PORT`

### Large Payload WebFlux
- **Port**: `8085`
- **Service**: `large-payload-webflux`
- **Protocol**: HTTP
- **Description**: Spring WebFlux API for streaming large payloads
- **Config Source**: `large-payload-webflux/src/main/resources/application.properties`
- **Override Variable**: `WEBFLUX_PORT`
- **Endpoints**:
  - `POST /api/payloads/ingest-gzip`
  - `POST /api/payloads/ingest-ndjson`
  - `GET /actuator/health`
  - `GET /actuator/info`

### Bulk Import Producer
- **Port**: `8080` (container), `8090` (host default)
- **Service**: `bulk-import-producer`
- **Protocol**: HTTP
- **Description**: CSV bulk import REST API with MongoDB backend
- **Config Source**: `bulk-import-producer/src/main/resources/application.yml`
- **Override Variable**: `BULK_IMPORT_PORT`
- **Endpoints**:
  - `GET /actuator/health`
  - `GET /actuator/metrics`
  - `GET /actuator/prometheus`
  - `GET /actuator/info`

## Infrastructure Services

### Kafka Broker (External Access)
- **Port**: `29092` (host)
- **Service**: `kafka`
- **Protocol**: TCP (Kafka)
- **Description**: External listener for Kafka broker (host machine access)
- **Config Source**: Docker Compose
- **Override Variable**: `KAFKA_PORT`
- **Connection String**: `localhost:29092` (from host), `kafka:9092` (from containers)

### Kafka Broker (Internal)
- **Port**: `9092`
- **Service**: `kafka`
- **Protocol**: TCP (Kafka)
- **Description**: Internal PLAINTEXT listener (container-to-container communication)
- **Config Source**: Kafka environment variable `KAFKA_LISTENERS`
- **Override Variable**: None (internal only)

### Kafka Controller
- **Port**: `9093`
- **Service**: `kafka`
- **Protocol**: TCP (Kafka)
- **Description**: KRaft controller listener for cluster management
- **Config Source**: Kafka environment variable `KAFKA_LISTENERS`
- **Override Variable**: None (internal only)

### MongoDB
- **Port**: `27017`
- **Service**: `mongodb`
- **Protocol**: TCP (MongoDB)
- **Description**: MongoDB database for bulk import service
- **Config Source**: Docker Compose default
- **Override Variable**: `MONGO_PORT`
- **Connection String**: `mongodb://localhost:27017/bulk_import` (from host), `mongodb://mongodb:27017/bulk_import` (from containers)

## Environment Variable Overrides

You can override the default host-side ports by setting environment variables before starting Docker Compose:

```zsh
# Example: Use alternative ports
export FRONTEND_PORT=13000
export BACKEND_PORT=18082
export CALCULATION_PORT=18083
export SIMULATION_PORT=18084
export WEBFLUX_PORT=18085
export BULK_IMPORT_PORT=18090
export KAFKA_PORT=19092
export MONGO_PORT=37017

docker compose up -d
```

Or inline:

```zsh
BACKEND_PORT=18082 FRONTEND_PORT=13000 docker compose up -d
```

## Quick Reference Table

| Service | Default Port | Protocol | Access | Override Variable |
|---------|--------------|----------|--------|-------------------|
| sim-engine-frontend | 3000 | HTTP | Public | FRONTEND_PORT |
| sim-engine-backend | 8082 | HTTP | Public | BACKEND_PORT |
| calculation-engine | 8083 | HTTP | Internal | CALCULATION_PORT |
| simulation-engine | 8084 | HTTP | Internal | SIMULATION_PORT |
| large-payload-webflux | 8085 | HTTP | Public | WEBFLUX_PORT |
| bulk-import-producer (host) | 8090 | HTTP | Public | BULK_IMPORT_PORT |
| bulk-import-producer (container) | 8080 | HTTP | - | - |
| kafka (external) | 29092 | TCP | Public | KAFKA_PORT |
| kafka (internal PLAINTEXT) | 9092 | TCP | Internal | - |
| kafka (controller) | 9093 | TCP | Internal | - |
| mongodb | 27017 | TCP | Public | MONGO_PORT |

## Bash Commands for Port Management

### List All Listening Ports

**Show all TCP listening ports with process info:**
```zsh
lsof -nP -iTCP -sTCP:LISTEN
```

**Show all listening ports (compact view):**
```zsh
netstat -an | grep LISTEN
```

**Show all listening ports with process names (requires sudo):**
```zsh
sudo lsof -i -P -n | grep LISTEN
```

### Check Specific Ports

**Check if a specific port is in use:**
```zsh
lsof -nP -iTCP:8082 -sTCP:LISTEN
```

**Check multiple project ports at once:**
```zsh
lsof -nP -iTCP:3000,8082,8083,8084,8085,8090,9092,9093,27017,29092 -sTCP:LISTEN
```

**Find process using a specific port:**
```zsh
lsof -ti:8082
```

**Kill process on a specific port:**
```zsh
kill -9 $(lsof -ti:8082)
```

### Check Docker Container Ports

**List all Docker container port mappings:**
```zsh
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Check specific container ports:**
```zsh
docker port sim-engine-backend
docker port kafka
docker port mongodb
```

**List all exposed ports from running containers:**
```zsh
docker ps --format "{{.Names}}: {{.Ports}}" | grep -E ":(3000|8082|8083|8084|8085|8090|9092|27017|29092)->"
```

### Verify Project Ports Availability

**Check if all project ports are free (before starting services):**
```zsh
for port in 3000 8082 8083 8084 8085 8090 9092 9093 27017 29092; do
  if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
    echo "⚠️  Port $port is IN USE"
    lsof -nP -iTCP:$port -sTCP:LISTEN
  else
    echo "✅ Port $port is FREE"
  fi
done
```

**Quick check if port is available:**
```zsh
nc -z localhost 8082 && echo "Port 8082 is open" || echo "Port 8082 is closed"
```

### Test Service Connectivity

**Test if service is responding on port:**
```zsh
curl -f http://localhost:8082/actuator/health && echo "✅ Backend is healthy"
curl -f http://localhost:8085/actuator/health && echo "✅ WebFlux is healthy"
curl -f http://localhost:8090/actuator/health && echo "✅ Bulk Import is healthy"
```

**Test all services health:**
```zsh
for port in 8082 8083 8084 8085 8090; do
  if curl -sf http://localhost:$port/actuator/health >/dev/null 2>&1; then
    echo "✅ Service on port $port is healthy"
  else
    echo "❌ Service on port $port is not responding"
  fi
done
```

**Test Kafka connectivity:**
```zsh
nc -zv localhost 29092
```

**Test MongoDB connectivity:**
```zsh
nc -zv localhost 27017
# or with mongosh
mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27017/bulk_import
```

## Port Conflict Resolution

If you encounter "port already in use" errors:

1. **Identify the conflict**:
   ```zsh
   lsof -nP -iTCP:8082 -sTCP:LISTEN
   ```

2. **Option A**: Stop the conflicting process
   ```zsh
   kill -9 $(lsof -ti:8082)
   ```

3. **Option B**: Use a different port via environment variable:
   ```zsh
   BACKEND_PORT=18082 docker compose up -d
   ```

4. **Option C**: Stop all Docker containers and restart:
   ```zsh
   docker compose down
   docker compose up -d
   ```

## Network Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Host Machine                                                 │
│                                                               │
│  Browser :3000 ────▶ Frontend Container :3000                │
│                                │                              │
│                                ▼                              │
│  cURL/App :8082 ───▶ Backend Container :8082 ─┐              │
│                                                │              │
│  cURL/App :8085 ───▶ WebFlux Container :8085 ─┤              │
│                                                │              │
│  cURL/App :8090 ───▶ Bulk Import :8080 ───────┤              │
│                                                │              │
│                                                ▼              │
│  Kafka Client :29092 ─────▶ Kafka :29092 (external)          │
│                               :9092 (PLAINTEXT) ◀───┐         │
│                               :9093 (controller)     │         │
│                                                │     │         │
│  MongoDB Client :27017 ────▶ MongoDB :27017   │     │         │
│                                                │     │         │
│  Worker :8083 ───────────▶ Calc Engine :8083 ─┘─────┘         │
│  Worker :8084 ───────────▶ Sim Engine :8084 ────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Notes

- **Internal ports** (9092, 9093) are only accessible within the Docker network
- **External ports** (left side of port mappings) can be customized via environment variables
- **Container ports** (right side of port mappings) are fixed in application configs
- All Spring Boot services expose actuator endpoints on their respective ports
- CORS is configured in `sim-engine-backend` to allow `localhost:3000` and `127.0.0.1:3000`
- Kafka bootstrap servers should use `kafka:9092` from containers, `localhost:29092` from host

## Related Documentation

- [how-to-run-me.md](how-to-run-me.md) - Service startup guide
- [docker-compose.yml](docker-compose.yml) - Full service definitions
- [Makefile](Makefile) - Helper commands for common tasks

