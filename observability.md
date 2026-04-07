# Observability

## Endpoints

| Service    | URL                          |
|------------|------------------------------|
| Prometheus | http://localhost:9090        |
| Grafana    | http://localhost:3000        |

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

## Pre-provisioned Dashboard

**Avro REST Service — Traffic Overview** is auto-loaded in Grafana and shows request rate, p95 latency, error rate, JVM heap, threads, CPU, and service health across all services.

## Quick Start

```bash
docker compose up -d prometheus grafana
```

