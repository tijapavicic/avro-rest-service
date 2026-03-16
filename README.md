# Avro REST Service (Spring Boot)

Spring Boot multi-module service with a shared Avro model module and separate modules per main component.

## Quick start guides

- Junior walkthrough: `how-to-run-me.md`
- Docker workflow: `docker-compose.yml`

## Modules

- `avro-model`: shared Avro schema and `AvroHttpMessageConverter`
- `sim-engine-frontend`: HTTP API layer
- `sim-engine-backend`: backend orchestration skeleton
- `calculation-engine`: calculation processing skeleton
- `simulation-engine`: simulation persistence skeleton

## Build and run

```bash
mvn -B clean verify
```

Run a specific component:

```bash
mvn -pl sim-engine-frontend spring-boot:run
```

Use the root `Makefile` for common tasks:

```bash
make build
make test
make run-frontend
make run-backend
make run-calculation
make run-simulation
make run-all
make status
make logs
make stop-all
make kafka-up
make topic-create TOPIC=logging-test-topic
make topic-list
make kafka-down
make e2e-smoke
make e2e-smoke-down

#quick usage:
make build
make test
make run-all
make status
make stop-all
```

## Run with Docker Compose

From the project root:

```bash
docker compose build
docker compose up -d
docker compose ps
```

Default local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8082`
- Calculation engine: `http://localhost:8083`
- Simulation engine: `http://localhost:8084`
- Kafka broker (host): `localhost:29092`

Kafka bootstrap behavior in compose:

- `kafka-init` one-shot service creates topic `logging-test-topic` at startup.
- `sim-engine-backend` publishes structured Avro traffic logs to `logging-test-topic` for `/api/**` requests.
- `sim-engine-backend` exposes only `health` and `info` actuator endpoints.

If a port is already in use, override host ports at runtime:

```bash
BACKEND_PORT=18082 CALCULATION_PORT=18083 SIMULATION_PORT=18084 FRONTEND_PORT=13000 KAFKA_PORT=39092 docker compose up -d
```

Kafka bootstrap values in this compose setup:

- From other containers: `kafka:9092`
- From host machine tools: `localhost:29092`

Kafka helper targets from `Makefile`:

```bash
make kafka-up
make kafka-logs
make topic-create TOPIC=logging-test-topic
make topic-list
make kafka-down
make e2e-smoke
make e2e-smoke-down
```

Check that the topic exists:

```bash
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --list
```

Check backend health endpoint:

```bash
curl -i http://localhost:8082/actuator/health
```

`make e2e-smoke` starts `kafka`, `sim-engine-backend`, `calculation-engine`, and `simulation-engine`, ensures the topic exists, and sends one `POST /api/simulations` request.

Use `make e2e-smoke-down` to stop only the smoke-test services without tearing down the full compose stack.

Optional overrides:

```bash
make e2e-smoke TOPIC=logging-test-topic E2E_SYSTEM_ID=SYS-002 E2E_REQUESTED_AT=2026-03-16T12:00:00Z
```

Stop and remove containers:

```bash
docker compose down
```

## Important compile fix (`createdAt` type)

`createdAt` in `avro-model/src/main/avro/user_event.avsc` uses Avro logical type `timestamp-millis`.
With Avro Java codegen, this maps to `java.time.Instant` in generated `UserEvent`, not `long`.

If `UserController` compares `createdAt` to `0L` or calls `setCreatedAt(long)`, compilation fails.

Use this pattern in `sim-engine-frontend/src/main/java/com/example/avro/api/UserController.java`:

```java
if (event.getCreatedAt() == null) {
    event.setCreatedAt(Instant.now());
}
```

If IntelliJ cannot resolve `UserEvent`, regenerate sources and re-sync Maven:

```bash
mvn generate-sources
```

Generated file location:

`avro-model/target/generated-sources/avro/com/example/avro/model/UserEvent.java`

## Common build issues

### 1) `Cannot resolve symbol UserEvent` (or package `com.example.avro.model`)

- **Cause:** Avro classes are generated at build time and may be missing/stale in IDE.
- **Fix:**

```bash
mvn clean generate-sources
```

Then refresh/reimport Maven in IntelliJ so `target/generated-sources/avro` is attached as a source root.

### 2) `createdAt` compile errors in `UserController`

- **Symptom:** errors like `bad operand types ... Instant and long` or `long cannot be converted to Instant`.
- **Cause:** `timestamp-millis` in Avro schema maps to `java.time.Instant` in generated Java.
- **Fix:** treat `createdAt` as `Instant` (null-check + `Instant.now()`), not as `long`.

### 3) `400 Bad Request` for simulation submit

- **Cause:** request validation is enforced for `POST /api/simulations`.
- **Required fields:** `systemId` (non-blank), `requestedAt` (ISO-8601 timestamp).
- **Fix:** send a payload like:

```bash
curl -i -X POST http://localhost:8082/api/simulations \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"systemId":"SYS-001","requestedAt":"2026-03-16T10:00:00Z"}'
```

## Test

```bash
mvn -B test
```

## Versioning

Current project version is tracked in both `VERSION` and Maven `pom.xml` files.

Use the helper script to bump both consistently:

```bash
./scripts/bump-version.sh <next-version>
```

Safe preview mode:

```bash
./scripts/bump-version.sh --dry-run --allow-dirty 0.0.2-SNAPSHOT
```

## Run:

```bash
mvn spring-boot:run
```
## Endpoints

The service supports both binary Avro (`application/avro`) and Avro JSON encoding (`application/avro+json`).

### Create user (Avro JSON)

```bash
curl -X POST http://localhost:8080/api/users \
  -H 'Content-Type: application/avro+json' \
  -H 'Accept: application/avro+json' \
  -d '{"id":"u-1","name":"Ada","age":31,"createdAt":1710000000000}'
```

### Get user (Avro JSON)

```bash
curl http://localhost:8080/api/users/u-1 \
  -H 'Accept: application/avro+json'
```

Quick run commands (per module):
The `curl` examples below target `sim-engine-frontend`, which runs on `localhost:8080` by default.
```shell
mvn -pl sim-engine-frontend spring-boot:run
mvn -pl sim-engine-backend spring-boot:run
mvn -pl calculation-engine spring-boot:run
mvn -pl simulation-engine spring-boot:run
```


## Schema

Avro schema is defined in `avro-model/src/main/avro/user_event.avsc` and code is generated at build time.

## Specifications

Repository specifications and design documents are indexed in:

- [`spec/README.md`](spec/README.md)

Simulation integration specifications created from the design discussion:

- [`spec/spec-architecture-simulation-engine-integration.md`](spec/spec-architecture-simulation-engine-integration.md)
- [`spec/spec-process-job-lifecycle.md`](spec/spec-process-job-lifecycle.md)
- [`spec/spec-data-calculation-completed-event.md`](spec/spec-data-calculation-completed-event.md)
- [`spec/spec-data-persistence-completed-event.md`](spec/spec-data-persistence-completed-event.md)

