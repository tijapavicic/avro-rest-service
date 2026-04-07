# Observability

To see structured JSON logs, activate the `production` Spring profile:

```shell
java -jar app.jar --spring.profiles.active=production
# or
SPRING_PROFILES_ACTIVE=production docker compose up
```

## Endpoints

| Service         | URL                          |
|-----------------|------------------------------|
| Prometheus      | http://localhost:9090         |
| Grafana         | http://localhost:3000         |
| Kibana          | http://localhost:5601         |
| Elasticsearch   | http://localhost:9200         |

## Grafana Credentials

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `admin` |

## Prometheus Targets

All Spring Boot services expose metrics at `/actuator/prometheus`:

| Service                | Scrape Target                          |
|------------------------|----------------------------------------|
| sim-engine-backend     | `sim-engine-backend:8082`              |
| large-payload-webflux  | `large-payload-webflux:8085`           |
| bulk-import-producer   | `bulk-import-producer:8080`            |
| calculation-engine     | `calculation-engine:8083`              |
| simulation-engine      | `simulation-engine:8084`               |

Verify targets: http://localhost:9090/targets

## Dashboard: Traffic Overview

Auto-provisioned at **Dashboards → Avro REST Service — Traffic Overview**.

Use the **Service** dropdown at the top to filter by one or more services.

| Row | Panels |
|-----|--------|
| **Header** | Service Health (UP/DOWN), Uptime |
| **HTTP Traffic** | Request rate, p50/p95/p99 latency, 2xx/4xx/5xx status distribution, per-endpoint breakdown, 5xx error rate (with threshold) |
| **@Timed Endpoints** | Simulation Submit, Payload Ingest Gzip, Payload Ingest NDJSON, Bulk Import CSV Upload, Job Status, List Jobs |
| **Logs & Errors** | Logback ERROR/WARN rate, log events by level (stacked) |
| **JVM** | Heap utilization % (with 70%/85% thresholds), heap used MB, GC pause time (with 200ms threshold), live threads |
| **System** | Process vs system CPU, open vs max file descriptors |

## Quick Start

```bash
# Metrics (Prometheus + Grafana)
docker compose up -d prometheus grafana

# Logs (ELK stack)
docker compose up -d elasticsearch logstash kibana

# Everything
docker compose up -d
```

## ELK Stack (Centralized Logs)

All services use the Docker GELF log driver to ship structured JSON logs through
Logstash into Elasticsearch. Kibana provides search & dashboards.

| Component       | Image                       | Port  |
|-----------------|-----------------------------|-------|
| Elasticsearch   | `elasticsearch:8.14.3`      | 9200  |
| Logstash        | `logstash:8.14.3`           | 12201 (UDP/GELF) |
| Kibana          | `kibana:8.14.3`             | 5601  |

**Kibana setup:** create a Data View for `avro-rest-service-*` → see full guide in [`elk.md`](elk.md).

### 🟢 P1 — Improvements (next sprint)

| # | Topic | Action |
|---|-------|--------|
| 8 | **`@Timed` only on bulk-import** | Add `@Timed` annotations to `sim-engine-backend` and `large-payload-webflux` controllers so Prometheus captures per-endpoint latency histograms |
| 9 | **Grafana alerting** | Add alert rules for 5xx error rate > 1% and p95 latency > 2s |
| 10 | **Structured JSON logging** | ✅ Added `logstash-logback-encoder` 7.4 — activate with `--spring.profiles.active=production` for JSON output; MDC keys (`transactionId`, `traceId`, `correlationId`) become top-level JSON fields |
| 10b | **ELK stack in Docker Compose** | ✅ Added Elasticsearch, Logstash, and Kibana to `docker-compose.yml` with GELF log driver on all services — see [`elk.md`](elk.md) |
| 11 | **Inter-service header propagation** | Add `WebClient` exchange filter that copies `X-Transaction-Id` from MDC to outbound requests |

---