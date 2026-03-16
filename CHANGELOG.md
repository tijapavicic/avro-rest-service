# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Root `VERSION` file to track the repository version string alongside Maven project versioning.
- Version bump utility `scripts/bump-version.sh` to update `VERSION` and all Maven module versions in one command.
- Kafka service wiring for app modules in `docker-compose.yml` with container bootstrap value `kafka:9092`.
- One-shot `kafka-init` service in `docker-compose.yml` to create `logging-test-topic` automatically at stack startup.
- New Avro schema `avro-model/src/main/avro/traffic_log_event.avsc` for structured traffic logging events.
- Kafka producer support in `sim-engine-backend` (`spring-kafka` dependency, producer serializers in `application.properties`).
- `TrafficLogPublisher` in `sim-engine-backend` to serialize and publish Avro binary events to Kafka.
- `TrafficLoggingInterceptor` + `WebConfig` in `sim-engine-backend` to capture HTTP metadata for `/api/**` traffic and publish logs asynchronously.
- Request-context enrichment in `SimulationController` to attach `systemId` to emitted traffic log metadata.
- New interceptor unit test: `sim-engine-backend/src/test/java/com/example/avro/config/TrafficLoggingInterceptorTest.java`.
- New `Makefile` helpers for Kafka/e2e workflow: `kafka-up`, `kafka-down`, `kafka-logs`, `topic-create`, `topic-list`, `e2e-smoke`, `e2e-smoke-down`.

### Changed
- Default `Makefile` topic variable updated to `logging-test-topic` for local validation.
- Documentation updated in `README.md` and `how-to-run-me.md` for Kafka startup, topic verification, and smoke-test lifecycle.

### Verification
- Verified module tests for affected modules:
  - `mvn -B -pl avro-model,sim-engine-backend -am test`
- Verified compose rendering includes `kafka-init` and logging topic config.
- Verified runtime flow by starting compose services, calling `POST /api/simulations`, and confirming `logging-test-topic` offsets increase.

### Before Commit Checklist
- Bump version in both `VERSION` and Maven modules:
  - `./scripts/bump-version.sh --allow-dirty <next-version>`
- Update this file (`CHANGELOG.md`) under `## [Unreleased]` with what changed.
- Run quality gates:
  - `mvn -B clean verify`
- If dependencies changed, run OWASP dependency check:
  - `mvn -B org.owasp:dependency-check-maven:check`
- Smoke test local stack when Kafka/compose/backend flow changes:
  - `make e2e-smoke`
  - `make e2e-smoke-down`

