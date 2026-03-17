# large-payload-webflux

Reactive module for large payload ingestion using Spring WebFlux.

## Endpoints

- `POST /api/payloads/ingest-gzip`
  - `Content-Type: application/json`
  - `Content-Encoding: gzip`
- `POST /api/payloads/ingest-ndjson`
  - `Content-Type: application/x-ndjson`
  - Optional `Content-Encoding: gzip`

## Configuration

`src/main/resources/application.properties`:

```properties
server.port=8085
app.payload.ingest.max-decompressed-bytes=1200000000
```

## Run

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -pl large-payload-webflux spring-boot:run
```

## Test

```zsh
cd /Users/copor/CodexProjects/avro-rest-service
mvn -pl large-payload-webflux test
```

