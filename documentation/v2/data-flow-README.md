# Data Flow Architecture Documentation

## Overview

This document describes the large payload processing architecture that handles 1GB+ data streams from the frontend through to database persistence, supporting both **legacy** and **next-generation** processing pipelines in parallel.

## Diagrams

### 1. Sequence Diagram
**File:** `data-flow-sequence-diagram.puml`

**Purpose:** Shows temporal flow of large payload processing

**Key Features:**
- ✅ **Dual pipeline processing**: Legacy and NG running in parallel
- ✅ **Queue partitioning**: 3 queues per pipeline for load distribution
- ✅ **Single external engine**: Shared persistence layer
- ✅ **HTTP 200 responses**: Success indicators
- ✅ **4 distinct phases**: Ingestion → Distribution → Consumption → Persistence

**Use When:**
- Understanding event timing
- Debugging payload flows
- Documenting consumer behavior
- Planning capacity

### 2. Component Diagram
**File:** `data-flow-component-diagram.puml`

**Purpose:** Shows system structure and component relationships

**Key Features:**
- ✅ **Layered architecture**: Frontend, Orchestration, Broker, Consumer, Processing, Persistence
- ✅ **Queue groups**: Visual organization of NG vs Legacy queues
- ✅ **Shared engine**: Single external-engine for both pipelines
- ✅ **Database separation**: Independent databases for NG and Legacy
- ✅ **Component notes**: Responsibilities documented

**Use When:**
- Architecture reviews
- Onboarding developers
- Planning migrations
- Capacity planning

## System Components

### Frontend Layer
```
┌─────────────────────────┐
│ simul-frontend          │
│ - Stream 1GB payloads   │
│ - HTTP chunked encoding │
└─────────────────────────┘
```

### Orchestration Layer
```
┌─────────────────────────┐
│ simul-orchestrator      │
│ - Receive HTTP streams  │
│ - Produce messages      │
│ - Publish to topics     │
└─────────────────────────┘
```

### Message Broker
```
┌─────────────────────────────────────┐
│ Kafka Topics                        │
├─────────────────────────────────────┤
│ processingNG Topic                  │
│  ├── rr1-ng-queue                   │
│  ├── rr2-ng-queue                   │
│  └── rr3-ng-queue                   │
├─────────────────────────────────────┤
│ processing Topic                    │
│  ├── rr1-queue                      │
│  ├── rr2-queue                      │
│  └── rr3-queue                      │
└─────────────────────────────────────┘
```

### Consumer Layer
```
┌────────────────────────────┐  ┌────────────────────────────┐
│ processingNG-kafka-consumer│  │ processing-kafka-consumer  │
│ - Consume from NG queues   │  │ - Consume from Legacy queues│
│ - Forward to external-engine│  │ - Forward to external-engine│
└────────────────────────────┘  └────────────────────────────┘
```

### Processing Layer
```
┌─────────────────────────┐
│ external-engine         │
│ - Process NG payloads   │
│ - Process Legacy payloads│
│ - Route to correct DB   │
│ - Return HTTP 200 OK    │
└─────────────────────────┘
```

### Persistence Layer
```
┌──────────────┐         ┌──────────────┐
│ postgreNgDB  │         │ postgreDB    │
│ (NG data)    │         │ (Legacy data)│
└──────────────┘         └──────────────┘
```

## Data Flow Sequence

### Phase 1: Data Ingestion
```
simul-frontend
      ↓ HTTP Stream (1GB payload, chunked transfer encoding)
simul-orchestrator
```

### Phase 2: Message Distribution
```
simul-orchestrator
      ↓ Publish
processingNG Topic → [rr1-ng-queue, rr2-ng-queue, rr3-ng-queue]
processing Topic → [rr1-queue, rr2-queue, rr3-queue]
```

### Phase 3: Message Consumption
```
NG Queues → processingNG-kafka-consumer
Legacy Queues → processing-kafka-consumer
```

### Phase 4: Persistence
```
processingNG-kafka-consumer → external-engine → postgreNgDB → [200 OK]
processing-kafka-consumer → external-engine → postgreDB → [200 OK]
```

## Key Design Patterns

### 1. Dual Pipeline Architecture
**Purpose:** Support both legacy and next-generation systems simultaneously

**Benefits:**
- ✅ **Zero-downtime migration**: Gradual transition from legacy to NG
- ✅ **A/B testing**: Compare performance of both pipelines
- ✅ **Rollback capability**: Fall back to legacy if NG has issues
- ✅ **Independent evolution**: Change NG without affecting legacy

**Tradeoffs:**
- ❌ Increased infrastructure costs
- ❌ More complex monitoring
- ❌ Duplicate data in some cases

### 2. Queue Partitioning (3 Queues per Pipeline)
**Purpose:** Enable parallel processing and load distribution

**Benefits:**
- ✅ **Horizontal scaling**: Add more consumers per queue
- ✅ **Load balancing**: Distribute payloads across partitions
- ✅ **Failure isolation**: Issues in one queue don't affect others
- ✅ **Throughput**: 3x parallelization potential

**Configuration:**
```yaml
Kafka Configuration:
  processingNG:
    partitions: 3
    replication-factor: 3
    consumers: 3-9 (1-3 per partition)
  
  processing:
    partitions: 3
    replication-factor: 3
    consumers: 3-9 (1-3 per partition)
```

### 3. Shared External Engine
**Purpose:** Consolidate persistence logic in single service

**Benefits:**
- ✅ **Single source of truth**: One place for persistence logic
- ✅ **Simplified maintenance**: Update logic once
- ✅ **Consistent validation**: Same rules for both pipelines
- ✅ **Easier monitoring**: Single endpoint to track

**Routing Logic:**
```java
public Response persist(Payload payload) {
    if (payload.isNextGen()) {
        persistToPostgreNgDB(payload);
    } else {
        persistToPostgreDB(payload);
    }
    return Response.ok().build();
}
```

### 4. Database Separation
**Purpose:** Isolate legacy and NG data stores

**Benefits:**
- ✅ **Schema independence**: NG can have different schema
- ✅ **Performance isolation**: NG load doesn't impact legacy
- ✅ **Migration flexibility**: Move data between DBs as needed
- ✅ **Security isolation**: Different access controls

## Architecture Requirements

### System Requirement: Large Payload Handling (1GB+)

**Frontend → Orchestrator:**
```
HTTP/1.1 Transfer-Encoding: chunked
Content-Type: application/octet-stream
```

**Orchestrator Configuration:**
```yaml
server:
  max-http-header-size: 64KB
  max-http-post-size: unlimited
  connection-timeout: 30m

spring:
  servlet:
    multipart:
      max-file-size: 10GB
      max-request-size: 10GB
```

**Consumer Configuration:**
```yaml
kafka:
  consumer:
    max-partition-fetch-bytes: 10485760  # 10MB
    fetch-max-wait-ms: 500
    session-timeout-ms: 30000
  
  producer:
    max-request-size: 10485760  # 10MB
    buffer-memory: 33554432  # 32MB
    compression-type: gzip
```

### Performance Characteristics

#### Throughput
```
Single Pipeline:
  - Orchestrator: 100 MB/s per instance
  - Kafka: 1 GB/s per broker
  - Consumer: 50 MB/s per instance
  - External Engine: 100 MB/s per instance

Total System (Dual Pipeline):
  - Max Ingestion: 200 MB/s
  - Max Processing: 300 MB/s (6 consumers)
  - Max Persistence: 200 MB/s (2 DB instances)
```

#### Latency
```
End-to-End (1GB payload):
  - Ingestion: 10-20 seconds
  - Queue time: 1-5 seconds
  - Processing: 10-20 seconds
  - Persistence: 10-20 seconds
  - Total: 30-60 seconds
```

#### Scalability
```
Horizontal Scaling:
  - Orchestrator: N instances (load balanced)
  - Kafka: 3-9 brokers per topic
  - Consumers: 3-9 per pipeline (1-3 per partition)
  - External Engine: 2-4 instances (load balanced)
  - Databases: Read replicas + connection pooling
```

## Monitoring & Observability

### Key Metrics
```yaml
Metrics to Track:
  # Ingestion
  - http_requests_total{endpoint="/stream"}
  - http_request_duration_seconds
  - http_payload_size_bytes
  
  # Message Broker
  - kafka_consumer_lag{topic="processingNG|processing"}
  - kafka_messages_consumed_total
  - kafka_messages_produced_total
  
  # Consumers
  - consumer_processing_duration_seconds
  - consumer_errors_total
  - consumer_success_total
  
  # External Engine
  - external_engine_requests_total
  - external_engine_http_200_total
  - external_engine_http_errors_total
  - external_engine_persistence_duration_seconds
  
  # Databases
  - db_connections_active
  - db_query_duration_seconds
  - db_rows_inserted_total
```

### Health Checks
```bash
# Orchestrator
curl http://simul-orchestrator:8080/actuator/health

# Consumers
curl http://processingNG-consumer:8080/actuator/health
curl http://processing-consumer:8080/actuator/health

# External Engine
curl http://external-engine:8080/actuator/health

# Databases
psql -h postgreNgDB -U user -c "SELECT 1"
psql -h postgreDB -U user -c "SELECT 1"
```

## Error Handling & Resilience

### Retry Strategy
```yaml
Kafka Consumer:
  max-retry-attempts: 3
  retry-backoff-ms: 1000
  retry-backoff-multiplier: 2
  max-retry-backoff-ms: 10000

External Engine:
  retry-on: [500, 502, 503, 504]
  max-retries: 3
  timeout: 30s
```

### Dead Letter Queue
```yaml
DLQ Configuration:
  processingNG-dlq: For NG failures after max retries
  processing-dlq: For Legacy failures after max retries
  
  retention: 7 days
  monitoring: Alert on any DLQ messages
```

### Circuit Breaker
```java
@CircuitBreaker(name = "external-engine", fallbackMethod = "fallbackPersist")
public Response persistToExternalEngine(Payload payload) {
    return externalEngineClient.persist(payload);
}

public Response fallbackPersist(Payload payload, Exception e) {
    logger.error("Circuit breaker open, queueing for retry", e);
    deadLetterQueue.send(payload);
    return Response.status(503).build();
}
```

## Security Considerations

### Transport Security
```yaml
Orchestrator:
  - TLS 1.3 for HTTPS endpoints
  - Client certificate authentication (optional)

Kafka:
  - SSL encryption between brokers and clients
  - SASL/PLAIN or SASL/SCRAM authentication
  - ACLs for topic access control

Databases:
  - SSL/TLS connections required
  - Credential rotation via secrets manager
  - Connection pooling with max idle time
```

### Data Validation
```java
public class PayloadValidator {
    public void validate(Payload payload) {
        // Size validation
        if (payload.size() > MAX_PAYLOAD_SIZE) {
            throw new PayloadTooLargeException();
        }
        
        // Schema validation
        if (!schemaValidator.isValid(payload.getSchema())) {
            throw new InvalidSchemaException();
        }
        
        // Content validation
        if (!contentValidator.isValid(payload.getContent())) {
            throw new InvalidContentException();
        }
    }
}
```

## Deployment Architecture

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simul-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: simul-orchestrator
  template:
    spec:
      containers:
      - name: orchestrator
        image: simul-orchestrator:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka:9092"
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  simul-orchestrator:
    image: simul-orchestrator:latest
    ports:
      - "8080:8080"
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    depends_on:
      - kafka
  
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
    depends_on:
      - zookeeper
  
  processingNG-consumer:
    image: processingNG-consumer:latest
    replicas: 3
    environment:
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - KAFKA_GROUP_ID=processingNG-group
  
  external-engine:
    image: external-engine:latest
    ports:
      - "9090:9090"
    environment:
      - POSTGRENG_URL=jdbc:postgresql://postgreNgDB:5432/ngdb
      - POSTGRE_URL=jdbc:postgresql://postgreDB:5432/legacydb
```

## Generating Diagrams

### Prerequisites
```bash
# Install PlantUML
brew install plantuml  # macOS
apt-get install plantuml  # Linux
```

### Generate PNG
```bash
cd documentation/v2

plantuml data-flow-sequence-diagram.puml
plantuml data-flow-component-diagram.puml
```

### Generate SVG (Scalable)
```bash
plantuml -tsvg data-flow-*.puml
```

### Generate ASCII (Terminal-friendly)
```bash
plantuml -ttxt data-flow-sequence-diagram.puml
```

## Migration Strategy

### Phase 1: Legacy Only
```
Frontend → Orchestrator → processing Topic → processing-kafka-consumer
                                           → external-engine
                                           → postgreDB
```

### Phase 2: Dual Pipeline (Current)
```
Frontend → Orchestrator → processingNG Topic → processingNG-kafka-consumer
                       └→ processing Topic → processing-kafka-consumer
                                          → external-engine
                                          → postgreNgDB | postgreDB
```

### Phase 3: NG Only (Future)
```
Frontend → Orchestrator → processingNG Topic → processingNG-kafka-consumer
                                           → external-engine
                                           → postgreNgDB
```

**Migration Steps:**
1. Deploy NG pipeline alongside legacy
2. Route small percentage of traffic to NG
3. Monitor and compare performance
4. Gradually increase NG traffic
5. Migrate legacy data to NG database
6. Deprecate legacy pipeline
7. Remove legacy components

## Related Documentation

- **[Appendix A](appendix-a-README.md)**: Simulation engine chunked architecture
- **[Appendix C](appendix-c-README.md)**: Direct streaming alternative
- **[Main README](../readme.md)**: Documentation index

## Troubleshooting

### Common Issues

**Issue: Consumer lag increasing**
```bash
# Check consumer lag
kafka-consumer-groups --bootstrap-server kafka:9092 \
  --describe --group processingNG-group

# Solutions:
# 1. Add more consumers
# 2. Increase partition count
# 3. Optimize consumer processing logic
```

**Issue: External engine returning 500 errors**
```bash
# Check external engine logs
kubectl logs -f deployment/external-engine

# Check database connections
kubectl exec -it deployment/external-engine -- \
  psql -h postgreNgDB -U user -c "SELECT count(*) FROM pg_stat_activity"

# Solutions:
# 1. Increase connection pool size
# 2. Check database performance
# 3. Enable circuit breaker
```

**Issue: Orchestrator OOM errors**
```bash
# Check memory usage
kubectl top pod -l app=simul-orchestrator

# Solutions:
# 1. Increase memory limits
# 2. Enable streaming processing (don't buffer entire payload)
# 3. Add backpressure handling
```

---

**Version:** 2.0  
**Last Updated:** March 17, 2026  
**Maintainer:** Architecture Team

