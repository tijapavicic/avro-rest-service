# Avro REST Service (Spring Boot)

Simple Spring Boot REST service using Avro schemas for request and response payloads.

## Build and run

```bash
mvn spring-boot:run
```

If you prefer to build a jar first:

```bash
mvn clean package
java -jar target/avro-rest-service-0.0.1-SNAPSHOT.jar
```

## Important compile fix (`createdAt` type)

`createdAt` in `src/main/avro/user_event.avsc` uses Avro logical type `timestamp-millis`.
With Avro Java codegen, this maps to `java.time.Instant` in generated `UserEvent`, not `long`.

If `UserController` compares `createdAt` to `0L` or calls `setCreatedAt(long)`, compilation fails.

Use this pattern in `src/main/java/com/example/avro/api/UserController.java`:

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

`target/generated-sources/avro/com/example/avro/model/UserEvent.java`

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

## Test

```bash
mvn test
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

## Schema

Avro schema is defined in `src/main/avro/user_event.avsc` and code is generated at build time.

## Specifications

Repository specifications and design documents are indexed in:

- [`spec/README.md`](spec/README.md)

Simulation integration specifications created from the design discussion:

- [`spec/spec-architecture-simulation-engine-integration.md`](spec/spec-architecture-simulation-engine-integration.md)
- [`spec/spec-process-job-lifecycle.md`](spec/spec-process-job-lifecycle.md)
- [`spec/spec-data-calculation-completed-event.md`](spec/spec-data-calculation-completed-event.md)
- [`spec/spec-data-persistence-completed-event.md`](spec/spec-data-persistence-completed-event.md)

