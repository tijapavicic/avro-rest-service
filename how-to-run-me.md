# How to run this project (Junior-friendly)

This guide explains how to run the components in this repo and manually test the current working flow.

## 1) What is in this repo?

Current runnable components:

- `sim-engine-frontend`: static web UI
- `sim-engine-backend`: Spring Boot REST API (`POST /api/simulations`)
- `calculation-engine`: Spring Boot worker scaffold (starts, no public HTTP API yet)
- `simulation-engine`: Spring Boot worker scaffold (starts, no public HTTP API yet)

Support module:

- `avro-model`: shared Avro classes used by Java modules

## 2) Prerequisites

- Java 17
- Maven 3.9+
- Node.js 18+ (`npm`/`npx`)
- `curl`

Check quickly:

```zsh
java -version
mvn -version
node -v
npm -v
curl --version
```

## 3) Build first (required)

From repo root:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify
```

Why this matters: Java modules depend on `avro-model`, and this command generates/builds everything in the correct order.

## 4) Run all components (recommended, simple)

### Terminal 1: Frontend

```zsh
cd /Users/copor/CodexProjects/avro-rest-service/sim-engine-frontend
npm start
```

Expected: static site available at `http://localhost:3000`.

### Terminal 2: Backend API

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
java -jar sim-engine-backend/target/sim-engine-backend-0.0.1-SNAPSHOT.jar
```

Expected: backend listening on port `8082`.

### Terminal 3: Calculation engine

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
java -jar calculation-engine/target/calculation-engine-0.0.1-SNAPSHOT.jar
```

Expected: app starts successfully (worker scaffold, no HTTP endpoint to call yet).

## 4.1) Run all components with Docker Compose (optional)

From repo root:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
docker compose build
docker compose up -d
docker compose ps
```

Default ports:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8082`
- calculation-engine: `http://localhost:8083`
- simulation-engine: `http://localhost:8084`
- kafka broker: `localhost:29092`

Compose also starts `kafka-init` (one-shot container) that creates topic `logging-test-topic`.
`sim-engine-backend` publishes structured Avro traffic logs to this topic for API traffic.

Quick backend smoke test:

```zsh
curl -i -X POST http://localhost:8082/api/simulations \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"systemId":"SYS-001","requestedAt":"2026-03-15T10:00:00Z"}'
```

If local ports are busy, override host ports when starting:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
BACKEND_PORT=18082 CALCULATION_PORT=18083 SIMULATION_PORT=18084 FRONTEND_PORT=13000 docker compose up -d
```

### 4.2) Kafka helper commands (optional, useful for local testing)

From repo root:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
make kafka-up
make topic-create TOPIC=logging-test-topic
make topic-list
make e2e-smoke
make e2e-smoke-down
```

Kafka bootstrap values:

- from other containers: `kafka:9092`
- from host tools: `localhost:29092`

Verify topic creation:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --list
```

`make e2e-smoke` does a quick end-to-end check by starting required services, creating the topic if needed, waiting for backend readiness, then calling `POST /api/simulations`.
Run `make e2e-smoke-down` when you are done to stop the services started for smoke testing.

### Terminal 4: Simulation engine

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
java -jar simulation-engine/target/simulation-engine-0.0.1-SNAPSHOT.jar
```

Expected: app starts successfully (worker scaffold, no HTTP endpoint to call yet).

## 5) Manual testing

## 5.1 Browser test (frontend -> backend)

1. Start frontend and backend using section 4 or section 4.1.
2. Open `http://localhost:3000`.
3. Click **Launch Simulation**.
4. Confirm response panel shows:
   - `status: SUBMITTED`
   - a generated `jobId`
   - JSON with `acceptedAt`

If button call fails, verify backend is running on `8082` and check CORS config in `sim-engine-backend/src/main/java/com/example/avro/config/CorsConfig.java`.

## 5.2 API test with curl

```zsh
curl -i -X POST http://localhost:8082/api/simulations \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"systemId":"SYS-001","requestedAt":"2026-03-15T10:00:00Z"}'
```

Expected:

- HTTP status `202 Accepted`
- JSON like:

```json
{
  "jobId": "JOB-XXXXXXXX",
  "status": "SUBMITTED",
  "systemId": "SYS-001",
  "acceptedAt": "2026-03-15T19:51:30.392151Z"
}
```

## 5.3 Verify scaffold services started

For `calculation-engine` and `simulation-engine`, manual verification is currently startup-only:

- process starts without exception
- startup banner appears
- app remains running

(These modules currently do not expose public REST endpoints in this repo state.)

## 6) Stop services

If running in 4 terminals, use `Ctrl+C` in each terminal.

If using Docker Compose:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
docker compose down
```

## 7) Common issues

### Issue: `mvn -pl sim-engine-backend spring-boot:run` fails with missing `avro-model`

Use the build-first flow and run the packaged jar:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify
java -jar sim-engine-backend/target/sim-engine-backend-0.0.1-SNAPSHOT.jar
```

### Issue: `Port 8082 was already in use`

Find and stop existing process, then restart backend:

```zsh
lsof -nP -iTCP:8082 -sTCP:LISTEN
```

## 8) Quick daily workflow

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify
```

Then run frontend + backend and do browser test from section 5.1.
