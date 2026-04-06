# How to run this project (Junior-friendly)

This guide explains how to run the components in this repo and manually test the current working flow.

## 1) What is in this repo?

Current runnable components:

- `sim-engine-frontend`: static web UI
- `sim-engine-backend`: Spring Boot REST API (`POST /api/simulations`)
- `large-payload-webflux`: Spring WebFlux large-payload API (`POST /api/payloads/ingest-gzip`, `POST /api/payloads/ingest-ndjson`)
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
JAR="$(ls sim-engine-backend/target/sim-engine-backend-*.jar | grep -v '.jar.original' | head -n 1)"
java -jar "$JAR"
```

Expected: backend listening on port `8082`.

### Terminal 3: Calculation engine

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
JAR="$(ls calculation-engine/target/calculation-engine-*.jar | grep -v '.jar.original' | head -n 1)"
java -jar "$JAR"
```

Expected: app starts successfully (worker scaffold, no HTTP endpoint to call yet).

### Terminal 3b: WebFlux large-payload API (parallel)

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
JAR="$(ls large-payload-webflux/target/large-payload-webflux-*.jar | grep -v '.jar.original' | head -n 1)"
java -jar "$JAR"
```

Expected: WebFlux API listening on port `8085`.

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
- large-payload-webflux: `http://localhost:8085`
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

Quick actuator health check:

```zsh
curl -i http://localhost:8082/actuator/health
```

If local ports are busy, override host ports when starting:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
BACKEND_PORT=18082 CALCULATION_PORT=18083 SIMULATION_PORT=18084 WEBFLUX_PORT=18085 FRONTEND_PORT=13000 docker compose up -d
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
JAR="$(ls simulation-engine/target/simulation-engine-*.jar | grep -v '.jar.original' | head -n 1)"
java -jar "$JAR"
```

Expected: app starts successfully (worker scaffold, no HTTP endpoint to call yet).

## 5) Manual testing

Quick copy-paste command file:

- `manual.test.commands.md`

### 5.1 Browser test (frontend -> backend)

1. Start frontend and backend using section 4 or section 4.1.
2. Open `http://localhost:3000`.
3. Click **Launch Simulation**.
4. Confirm response panel shows:
   - `status: SUBMITTED`
   - a generated `jobId`
   - JSON with `acceptedAt`

If button call fails, verify backend is running on `8082` and check CORS config in `sim-engine-backend/src/main/java/com/example/avro/config/CorsConfig.java`.

### 5.2 API test with curl

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

### 5.2.1 Large gzip payload test

Both `sim-engine-backend` (`8082`) and `large-payload-webflux` (`8085`) support a streaming gzip endpoint for very large JSON bodies.

Relevant config in `sim-engine-backend/src/main/resources/application.properties`:

```properties
app.payload.ingest.max-decompressed-bytes=1200000000
```

This limit applies after gzip decompression.

Create a gzip test file and send it:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
gzip -c spec/payload_sample_iso.json > /tmp/payload_sample_iso.json.gz

curl -i -X POST http://localhost:8082/api/payloads/ingest-gzip \
  -H 'Content-Type: application/json' \
  -H 'Content-Encoding: gzip' \
  -H 'Accept: application/json' \
  --data-binary @/tmp/payload_sample_iso.json.gz
```

Expected:

- HTTP `202 Accepted`
- JSON response with `itemsProcessed`

To call the WebFlux module instead, replace `8082` with `8085`.

### 5.2.2.0 Note on gzip vs NDJSON

```shell
cd /Users/copor/CodexProjects/avro-rest-service/sim-engine-frontend

# Install dependencies
npm install

# Run all tests
npm test

# Generate coverage report
npm run test:coverage
```


### 5.2.2 NDJSON streaming test

For very large uploads, NDJSON is often easier to stream because items are sent one line at a time.

File example in this repo:

- `spec/payload_sample.ndjson`

Send it with:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service

curl -i -X POST http://localhost:8082/api/payloads/ingest-ndjson \
  -H 'Content-Type: application/x-ndjson' \
  -H 'Accept: application/json' \
  --data-binary @spec/payload_sample.ndjson
```

NDJSON format used here:

- first line: metadata object with `scenarionID`, `systemId`, `date`
- each next line: one item object with `item1`, `item2`

Expected:

- HTTP `202 Accepted`
- JSON response with `itemsProcessed`

To call the WebFlux module instead, replace `8082` with `8085`.

### 5.3 Verify scaffold services started

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
JAR="$(ls sim-engine-backend/target/sim-engine-backend-*.jar | grep -v '.jar.original' | head -n 1)"
java -jar "$JAR"
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

## 9) How to bump project version (developer-friendly)

This repo tracks version in two places:

- `VERSION`
- Maven `pom.xml` files (root + modules)

Use one command so they stay in sync.

### Step 1: Safe preview (no file changes)

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
./scripts/bump-version.sh --dry-run --allow-dirty <next-version>
```

### Step 2: Real version bump

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
./scripts/bump-version.sh --allow-dirty <next-version>
```

### Step 3: Verify what changed

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
git --no-pager status --short
cat VERSION
```

Version format accepted by the script:

- `X.Y.Z`
- `X.Y.Z-SNAPSHOT`

## 10) Before commit checklist

Use this short checklist before creating a commit/PR:

1. Bump version (if needed):

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
./scripts/bump-version.sh --allow-dirty <next-version>
```

2. Update `CHANGELOG.md` under `## [Unreleased]` with your changes.

3. Run build + tests:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B clean verify
```

4. If dependencies changed, run OWASP dependency scan:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -B org.owasp:dependency-check-maven:check
```

5. If your change touched Kafka/backend/compose flow, run smoke test:

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
make e2e-smoke
make e2e-smoke-down
```

