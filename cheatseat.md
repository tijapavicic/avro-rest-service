# Avro REST Service Cheat Sheet (Junior Dev)

This quick guide helps you build, run, verify, and manually test the full stack.

## 1) Prerequisites

- macOS/Linux shell (`zsh`)
- Java 17
- Maven 3.9+
- Node.js 18+ and `npx` (for frontend dev server)
- `curl`

Check your tooling:

```zsh
java -version
mvn -version
node -v && npx --version
curl --version
```

## 2) Build Java Modules

From repo root (`avro-rest-service`):

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify
```

> `sim-engine-frontend` is a vanilla JavaScript Web Components app — no build step needed.

## 3) Run the Whole Stack

Port map:

| Service | Tech | Port |
|---|---|---|
| `sim-engine-frontend` | Web Components (static files) | `3000` |
| `sim-engine-backend` | Spring Boot REST | `8082` |
| `calculation-engine` | Spring Boot | `8083` |
| `simulation-engine` | Spring Boot | `8084` |

Start everything in one command (background, logs to `.run/`):

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
make run-all
```

Or start each service individually:

```zsh
# Frontend (static file server)
make serve-frontend
# → open http://localhost:3000

# Backend REST API
make run-backend
# → listening on http://localhost:8082
```

## 4) Check Logs and Status

### Process status from PID files

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
for name in frontend backend calculation simulation; do
  if [[ -f .run/${name}.pid ]]; then
    pid=$(cat .run/${name}.pid)
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "${name}: running (${pid})"
    else
      echo "${name}: stale pid file (${pid})"
    fi
  else
    echo "${name}: not running"
  fi
done
```

### Confirm ports are listening

```zsh
lsof -nP -iTCP:8081 -sTCP:LISTEN
lsof -nP -iTCP:8082 -sTCP:LISTEN
lsof -nP -iTCP:8083 -sTCP:LISTEN
lsof -nP -iTCP:8084 -sTCP:LISTEN
```

### Tail logs

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
tail -n 80 -f .run/frontend.log .run/backend.log .run/calculation.log .run/simulation.log
```

## 5) Stop the Stack

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
for name in frontend backend calculation simulation; do
  if [[ -f .run/${name}.pid ]]; then
    pid=$(cat .run/${name}.pid)
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      echo "stopped ${name} (${pid})"
    fi
    rm -f .run/${name}.pid
  fi
done
```

Optional cleanup:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
rm -rf .run
```

## 6) Manual End-to-End Test with browser and `curl`

### A) Browser test (recommended)

1. Start the stack: `make run-all`
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. You will see the **Simulation Control Panel** homepage
4. Click **🚀 Launch Simulation**
5. The button sends a `POST` request to `http://localhost:8082/api/simulations`
6. The response panel shows:
   - A **SUBMITTED** badge
   - The generated `jobId`
   - The full JSON response

Current scope note:

- The repository currently exposes a working simulation submit API in `sim-engine-backend`.
- Other modules (`calculation-engine`, `simulation-engine`) run as separate services but cross-service job orchestration is still scaffold-level.

### B) Direct `curl` test against backend

```zsh
curl -i -X POST http://localhost:8082/api/simulations \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"systemId":"SYS-001","requestedAt":"2026-03-15T10:00:00Z"}'
```

### Read back (not yet implemented — backend is stateless skeleton):

```zsh
curl -i http://localhost:8082/api/simulations \
  -H 'Accept: application/json'
```

Expected outcome for POST:

- Returns `202 Accepted`
- Body contains `jobId`, `status: "SUBMITTED"`, `systemId`, `acceptedAt`

## Module Reference

| Module | Tech | Role |
|---|---|---|
| `avro-model` | Java / Avro | Shared schema + `AvroHttpMessageConverter` |
| `sim-engine-frontend` | Vanilla JS / Web Components | Homepage UI, sends jobs to backend |
| `sim-engine-backend` | Spring Boot REST | `POST /api/simulations`, CORS, orchestration |
| `calculation-engine` | Spring Boot | Calculation processing (scaffold) |
| `simulation-engine` | Spring Boot | Persistence / simulation (scaffold) |

## Version bump quick steps

Use the helper script so `VERSION` and all Maven module versions are updated together.

```zsh
cd /Users/copor/CodexProjects/avro-rest-service

# Preview only
./scripts/bump-version.sh --dry-run --allow-dirty 0.0.3-SNAPSHOT

# Apply
./scripts/bump-version.sh --allow-dirty 0.0.3-SNAPSHOT

# Verify
git --no-pager status --short
cat VERSION
```

