# ELK Stack — Centralized Log Visualization

This project ships a full **Elasticsearch → Logstash → Kibana** stack in
`docker-compose.yml`. All five Spring Boot services forward structured JSON logs
to Logstash via the Docker **GELF** log driver, which indexes them in
Elasticsearch for querying and visualization in Kibana.

## Architecture

```
┌──────────────────────┐  GELF/UDP   ┌───────────┐  index   ┌───────────────┐
│  Spring Boot services│ ──────────► │ Logstash  │ ───────► │ Elasticsearch │
│  (production profile)│   :12201    │  pipeline  │          │  single-node  │
└──────────────────────┘             └───────────┘          └───────┬───────┘
                                                                    │
                                                              ┌─────▼─────┐
                                                              │  Kibana   │
                                                              │  :5601    │
                                                              └───────────┘
```

## Endpoints

| Service         | URL                       | Purpose                       |
|-----------------|---------------------------|-------------------------------|
| Elasticsearch   | http://localhost:9200      | REST API / cluster health     |
| Kibana          | http://localhost:5601      | Log search & dashboards       |
| Logstash (GELF) | `udp://localhost:12201`   | Log ingestion from containers |

## Quick Start

### Start everything (ELK + all services)

```bash
docker compose up -d
```

### Start only the ELK stack

```bash
docker compose up -d elasticsearch logstash kibana
```

### Start ELK + one service

```bash
docker compose up -d elasticsearch logstash kibana bulk-import-producer
```

## How it works

### 1. Production profile activates JSON logging

Each service has `SPRING_PROFILES_ACTIVE: production` in `docker-compose.yml`.
This activates the `<springProfile name="production">` block in
`logback-spring.xml`, which uses `logstash-logback-encoder` to emit one JSON
object per log line:

```json
{
  "@timestamp": "2026-04-08T14:05:12.345Z",
  "@version": "1",
  "message": "CSV upload started",
  "logger_name": "com.example.avro.bulk.service.ImportService",
  "thread_name": "reactor-http-nio-3",
  "level": "INFO",
  "service": "bulk-import-service",
  "transactionId": "abc-123",
  "traceId": "",
  "correlationId": "req-456"
}
```

### 2. Docker GELF driver ships logs to Logstash

Each service uses the GELF logging driver:

```yaml
logging:
  driver: gelf
  options:
    gelf-address: "udp://localhost:12201"
    tag: "bulk-import-producer"
```

> **Note:** With the GELF driver, `docker logs <container>` is unavailable. Use
> Kibana instead, or temporarily remove the `logging:` block for local debugging.

### 3. Logstash parses and enriches

The pipeline at `docker/logstash/pipeline/logstash.conf`:

- Receives GELF messages on UDP 12201
- Parses the embedded JSON from `logstash-logback-encoder`
- Promotes `service`, `level`, `transactionId`, `traceId`, `correlationId` to
  top-level fields
- Forwards to Elasticsearch index `avro-rest-service-YYYY.MM.dd`

### 4. Kibana visualizes

Open http://localhost:5601 and create a **Data View** for the
`avro-rest-service-*` index pattern.

## Setting up Kibana (first time)

1. Open http://localhost:5601
2. Go to **Management → Stack Management → Data Views**
3. Click **Create data view**
4. Set the index pattern to `avro-rest-service-*`
5. Choose `@timestamp` as the time field
6. Click **Save data view to Kibana**
7. Go to **Discover** to start exploring logs

### Useful Kibana filters

| Filter                                 | Purpose                        |
|----------------------------------------|--------------------------------|
| `service: "bulk-import-service"`       | Logs from bulk-import-producer |
| `log_level: "ERROR"`                   | All errors across services     |
| `transactionId: "abc-123"`             | Trace a single business flow   |
| `container: "sim-engine-backend"`      | Logs by container name         |

## MDC fields

| MDC key           | Description                           | Kibana field      |
|-------------------|---------------------------------------|-------------------|
| `transactionId`   | Business-level transaction identifier | `transactionId`   |
| `traceId`         | Distributed tracing span ID          | `traceId`         |
| `correlationId`   | Request correlation / idempotency key | `correlationId`   |

## Port reference

All ports are configurable via environment variables:

| Variable               | Default | Service         |
|------------------------|---------|-----------------|
| `ELASTICSEARCH_PORT`   | 9200    | Elasticsearch   |
| `KIBANA_PORT`          | 5601    | Kibana          |
| `LOGSTASH_GELF_PORT`   | 12201   | Logstash (GELF) |

## File layout

```
docker/
└── logstash/
    ├── logstash.yml                  # Logstash settings
    └── pipeline/
        └── logstash.conf             # Input → Filter → Output pipeline
```

## Switching back to local dev logging

When running outside Docker (or for local debugging), omit the production
profile and logs revert to human-readable console output:

```bash
# Local JAR — default profile (plain text)
java -jar app.jar

# Local JAR — production profile (JSON)
java -jar app.jar --spring.profiles.active=production
```

To disable GELF for a single service during local Docker debugging, override the
logging driver:

```bash
docker compose run --rm -e SPRING_PROFILES_ACTIVE=dev \
  --log-driver json-file bulk-import-producer
```

## Resource usage

The ELK stack is memory-intensive. Default JVM heap settings in
`docker-compose.yml`:

| Service        | Heap        |
|----------------|-------------|
| Elasticsearch  | 512 MB      |
| Logstash       | 256 MB      |

To reduce footprint on development machines, lower `ES_JAVA_OPTS` /
`LS_JAVA_OPTS` or stop ELK when not needed:

```bash
docker compose stop elasticsearch logstash kibana
```

## Verifying the pipeline

```bash
# 1. Check Elasticsearch is healthy
curl -s http://localhost:9200/_cluster/health | jq .

# 2. List indices (should show avro-rest-service-YYYY.MM.dd)
curl -s http://localhost:9200/_cat/indices?v

# 3. Count indexed documents
curl -s "http://localhost:9200/avro-rest-service-*/_count" | jq .

# 4. Sample search for errors
curl -s "http://localhost:9200/avro-rest-service-*/_search?q=log_level:ERROR&size=5" | jq .
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `docker logs` shows nothing | GELF driver redirects stdout | Use Kibana or temporarily remove the `logging:` block |
| No index in Kibana | Services haven't produced logs yet | Hit an endpoint, then check `_cat/indices` |
| Elasticsearch OOM | Heap too large for host | Lower `ES_JAVA_OPTS` to `-Xms256m -Xmx256m` |
| Logstash won't start | Elasticsearch not healthy yet | It will retry — `depends_on` uses `service_healthy` |
| Port 12201 conflict | Another GELF listener on host | Set `LOGSTASH_GELF_PORT=12202` |
