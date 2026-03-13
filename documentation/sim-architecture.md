---
title: Design Specification for Simulation Engine Integration Protocols
version: 1.0
date_created: 2026-03-13
last_updated: 2026-03-13
owner: Application Architecture Team
tags: [design, integration, protocols, simulation, data, architecture]
---

# Introduction

This specification defines the end-to-end integration design for a simulation workflow involving `sim-engine-frontend`, `sim-engine-backend`, `calculation-engine`, a source database, and a target simulation database. The main design challenge is transporting and persisting a large tabular result set of approximately 1,000,000 rows with 50 columns in a reliable, scalable, and operationally safe manner.

This specification is written to be self-contained, explicit, and suitable for implementation by developers, reviewers, and Generative AI systems.

## 1. Purpose & Scope

The purpose of this specification is to define the recommended protocols, interaction patterns, data movement constraints, and acceptance criteria for the simulation integration flow.

### In Scope
- Communication between:
    - `sim-engine-frontend`
    - `sim-engine-backend`
    - `calculation-engine`
    - source database
    - `simulation-engine`
    - target simulation database
- Protocol selection for control traffic and bulk data transfer.
- Large dataset handling strategy.
- Reliability, observability, and idempotency requirements.
- Mermaid diagrams describing the architecture and sequence flow.

### Out of Scope
- Vendor-specific cloud deployment details.
- Exact table schema definition for the 50-column dataset.
- Authentication and authorization implementation details beyond interface constraints.
- Detailed storage retention policy.

### Intended Audience
- Solution architects
- Backend developers
- Platform engineers
- Data engineers
- DevOps and SRE teams
- AI coding agents generating implementation changes

### Assumptions
- The `sim-engine-frontend` is interactive and user-facing.
- The `calculation-engine` retrieves large result sets from a source database.
- The `simulation-engine` persists the result into a separate database.
- Large result sets must not be transferred as a single in-memory JSON payload through synchronous HTTP hops.

## 2. Definitions

- **Control Plane**: Communication used for commands, acknowledgements, status, and metadata.
- **Data Plane**: Communication used for transferring the bulk result dataset.
- **Bulk Load**: Database-native high-throughput ingestion method such as `COPY`, `BULK INSERT`, or equivalent.
- **Chunk**: A bounded subset of a larger dataset, transferred or stored independently.
- **Correlation ID**: A globally unique identifier used to trace a request across services.
- **Job ID**: A unique identifier for a simulation request lifecycle.
- **Object Storage**: Durable blob/file storage used for chunked result handoff.
- **Parquet**: Columnar file format optimized for efficient analytics and large datasets.
- **SSE**: Server-Sent Events.
- **gRPC Streaming**: Remote procedure call pattern where messages are streamed incrementally.
- **Idempotency**: Property that repeated processing of the same request produces the same final outcome without duplication.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The frontend shall submit simulation requests to the backend using a synchronous request suitable for user-driven interaction.
- **REQ-002**: The backend shall create and return a `jobId` immediately without blocking on calculation completion.
- **REQ-003**: The backend shall propagate `jobId` and `correlationId` to downstream services.
- **REQ-004**: The calculation engine shall retrieve source data using streaming or cursor-based access.
- **REQ-005**: The system shall support a result size of at least 1,000,000 rows with 50 columns.
- **REQ-006**: The simulation engine shall persist the large result set into a separate target database.
- **REQ-007**: The system shall expose observable job states from submission through completion or failure.
- **REQ-008**: The system shall support retry without causing duplicate persistence of already-processed chunks.
- **REQ-009**: The design shall separate control-plane messages from data-plane transfer for large result sets.
- **REQ-010**: The design shall support chunked data handling rather than monolithic full-payload transport.

- **SEC-001**: All service-to-service communication shall be protected in transit.
- **SEC-002**: Access to source and target databases shall use managed credentials or secret storage and shall not use hardcoded credentials.
- **SEC-003**: Bulk result data locations shall be access-controlled and scoped to least privilege.
- **SEC-004**: Integrity metadata such as checksums shall be available for transferred chunks or files.
- **SEC-005**: The design shall prevent unauthorized retrieval of full result sets.

- **REL-001**: The system shall tolerate temporary downstream unavailability through asynchronous decoupling.
- **REL-002**: Large dataset transfer shall support resumable or restartable processing at chunk/file level.
- **REL-003**: Job status transitions shall be durable and queryable.
- **REL-004**: Duplicate delivery of control messages shall not cause duplicate final persistence.

- **PER-001**: The design shall avoid loading the entire 1,000,000-row result into memory in any service.
- **PER-002**: The design shall prefer bulk-oriented formats and protocols for large data movement.
- **PER-003**: The simulation engine shall use bulk load mechanisms rather than row-by-row inserts for the target database.

- **CON-001**: The frontend shall not directly request the full 1,000,000-row dataset from the backend in a single synchronous response.
- **CON-002**: The backend shall not proxy the full result set through repeated synchronous REST responses.
- **CON-003**: The calculation engine shall not serialize the entire result set to a single large JSON response for the simulation engine.
- **CON-004**: The design shall treat control messaging retries differently from bulk data transfer retries.

- **GUD-001**: Prefer REST for user-facing submission and status endpoints.
- **GUD-002**: Prefer messaging for long-running orchestration between backend and calculation/simulation services.
- **GUD-003**: Prefer object storage plus metadata events for bulk data handoff.
- **GUD-004**: Prefer Parquet for large tabular result sets unless a stronger requirement dictates another format.
- **GUD-005**: If direct service-to-service streaming is mandatory, prefer gRPC streaming or Apache Arrow Flight over REST JSON.

- **PAT-001**: Use a job-based asynchronous workflow.
- **PAT-002**: Use event-driven completion notification.
- **PAT-003**: Use file/chunk handoff for large datasets.
- **PAT-004**: Use chunk-level persistence checkpoints in the simulation engine.

## 4. Interfaces & Data Contracts

### 4.1 Protocol Recommendations by Hop

| Interface ID | Source | Target | Recommended Protocol | Payload Type | Purpose |
|---|---|---|---|---|---|
| IF-001 | `sim-engine-frontend` | `sim-engine-backend` | HTTPS REST | JSON | Submit simulation request |
| IF-002 | `sim-engine-backend` | `sim-engine-frontend` | HTTPS REST or SSE | JSON | Job status and progress |
| IF-003 | `sim-engine-backend` | message broker | Asynchronous messaging | Avro, Protobuf, or JSON | Publish simulation request command |
| IF-004 | message broker | `calculation-engine` | Asynchronous messaging | Avro, Protobuf, or JSON | Deliver simulation request command |
| IF-005 | `calculation-engine` | source database | Native database protocol | SQL + streamed result set | Retrieve source data |
| IF-006 | `calculation-engine` | object storage | File upload protocol | Parquet files | Store result chunks |
| IF-007 | `calculation-engine` | message broker | Asynchronous messaging | JSON/Avro/Protobuf metadata | Publish calculation completion and chunk manifest |
| IF-008 | message broker | `simulation-engine` | Asynchronous messaging | JSON/Avro/Protobuf metadata | Notify data availability |
| IF-009 | `simulation-engine` | object storage | File download protocol | Parquet files | Read result chunks |
| IF-010 | `simulation-engine` | target database | Native bulk-load protocol | File/chunk ingestion | Persist result set |
| IF-011 | `simulation-engine` | message broker | Asynchronous messaging | JSON/Avro/Protobuf metadata | Publish persistence completed event |

### 4.2 Primary Interaction Contract

#### Simulation Request
```json
{
  "jobId": "JOB-20260313-0001",
  "correlationId": "0f44d8d7-4a9c-4c0c-96a1-95d8f0b42101",
  "systemId": "SYS-12345",
  "requestedAt": "2026-03-13T10:15:30Z",
  "simulationParameters": {
    "fromDate": "2026-03-01",
    "toDate": "2026-03-31"
  }
}
```

4.3 Recommended Job State Model
```markdown
### 4.3 Recommended Job State Model

| State | Meaning |
|---|---|
| `SUBMITTED` | Frontend request accepted by backend |
| `QUEUED` | Command published and awaiting worker processing |
| `RUNNING` | Calculation in progress |
| `DATA_READY` | Result chunks written and ready for simulation engine |
| `PERSISTING` | Simulation engine is loading data into target DB |
| `COMPLETED` | Persistence finished successfully |
| `FAILED` | Processing terminated unsuccessfully |
| `PARTIAL_RETRY` | One or more chunks require reprocessing |
```

## 4.4 Protocol Decision

### Recommended Primary Design

- `sim-engine-frontend` to `sim-engine-backend`: HTTPS REST
- Job progress to frontend: SSE or polling
- Backend orchestration to downstream services: asynchronous messaging
- Bulk dataset handoff: object storage with Parquet chunks
- Target persistence: native bulk-load protocol

### Alternative Direct-Streaming Design

If object storage is not acceptable and direct transfer is mandatory:

- `calculation-engine` to `simulation-engine`: gRPC server streaming
- Payload encoding: Protobuf or Apache Arrow Flight
- Transfer unit: chunks, not full dataset
- Acknowledgement: chunk-level
- Retry granularity: chunk-level only

### Non-Recommended Design

- Synchronous REST JSON transfer of the full 1,000,000-row dataset
- Row-by-row database insert on the simulation engine
- Frontend waiting synchronously for the full result

## 5. Acceptance Criteria

## 5. Acceptance Criteria

- **AC-001**: Given a user submits a simulation request, when the backend accepts it, then the backend returns a `jobId` without waiting for calculation completion.
- **AC-002**: Given a simulation request is accepted, when it is sent downstream, then `jobId`, `correlationId`, and `systemId` are included in the command message.
- **AC-003**: Given the calculation engine reads source data, when the dataset is large, then the engine processes the result using streaming or chunked retrieval rather than loading the entire dataset into memory.
- **AC-004**: Given the calculation engine finishes producing result chunks, when data becomes available, then it publishes a completion event containing chunk metadata.
- **AC-005**: Given the simulation engine receives the completion event, when it loads the data, then it uses chunk-aware and idempotent persistence behavior.
- **AC-006**: Given a retry occurs for a previously processed chunk, when the retry is executed, then the target dataset does not contain duplicate rows caused by duplicate chunk persistence.
- **AC-007**: Given a client queries job status, when the job is in progress, then the backend returns a valid lifecycle state from the defined state model.
- **AC-008**: Given a dataset of 1,000,000 rows and 50 columns, when the workflow executes, then the system does not require a single monolithic synchronous response across services.
- **AC-009**: Given object storage handoff is used, when a chunk is transferred, then the simulation engine can validate chunk integrity using provided metadata.
- **AC-010**: Given the direct streaming alternative is implemented, when a transfer fails mid-stream, then restart occurs at chunk boundary or checkpoint rather than from the entire job beginning.

## 6. Test Automation Strategy

### Test Levels
- Unit
- Integration
- Contract
- Performance
- Resilience

### Frameworks
- Service-native unit test frameworks
- Contract validation tooling
- Broker integration tests
- Database integration tests
- Load and performance test tooling

### Test Data Management
- Synthetic dataset generators for 1,000,000-row scenarios
- Representative 50-column schemas
- Smaller chunked fixtures for deterministic tests

### CI/CD Integration
- Run unit and contract tests on pull requests
- Run integration tests for message flow and object storage manifest handling
- Run scheduled or gated performance tests for large-volume scenarios

### Coverage Requirements
- All state transitions must be covered
- Chunk retry and duplicate-delivery handling must be covered
- Failure-path tests must exist for data-ready and persistence events

### Performance Testing
- Validate throughput for large-volume chunk production and ingestion
- Measure end-to-end processing time for 1,000,000-row workloads
- Confirm memory usage remains bounded and does not require full dataset materialization
- Verify retry and restart behavior at chunk boundaries under fault conditions


### Resilience Testing

- Duplicate message delivery
- Broker redelivery
- Partial chunk write/read failure
- Target DB transient failure
- Object storage temporary unavailability

### Suggested Automated Test Scenarios

- Command published once, delivered multiple times
- Chunk manifest contains missing file
- Checksum mismatch on one chunk
- Bulk-load failure after some chunks already committed
- Status endpoint behavior during long-running jobs

## 7. Rationale \& Context

This system handles a high\-volume tabular result set that is too large for naive synchronous HTTP JSON transport. The main architectural objective is to decouple user request submission from long\-running calculation and persistence work.

The recommended design separates:

\- **Control plane** traffic for orchestration and status  
\- **Data plane** traffic for the large dataset

This separation improves:

\- **Reliability**, because long\-running work is asynchronous  
\- **Performance**, because large results are moved using bulk\-friendly formats  
\- **Recoverability**, because retries can occur at chunk level  
\- **Observability**, because the job lifecycle is explicit

The choice of object storage plus metadata events is preferred because it avoids pushing the 1,000,000\-row payload through multiple services in memory. It also aligns with scalable data platform patterns and reduces coupling between calculation and simulation services.

The direct streaming alternative is acceptable only when object storage is not viable and the operational team is prepared to handle streaming checkpoints, backpressure, and retry complexity.


## 8. Dependencies \& External Integrations

### External Systems
- **EXT-001**: Source operational or analytical database holding the data to be queried by the calculation engine.
- **EXT-002**: Target simulation database used by the simulation engine for persistence.
- **EXT-003**: User-facing frontend client consuming backend status APIs.

### Third-Party Services
- **SVC-001**: Message broker providing asynchronous command and event transport.
- **SVC-002**: Object storage providing durable storage for chunked result files.

### Infrastructure Dependencies
- **INF-001**: Secure network connectivity between all participating services.
- **INF-002**: Durable storage for job metadata and status transitions.
- **INF-003**: Monitoring and log aggregation capable of tracing a `correlationId`.
- **INF-004**: Compute environments sized for chunk transformation and bulk-load operations.

### Data Dependencies
- **DAT-001**: Source query result containing approximately 1,000,000 rows and 50 columns.
- **DAT-002**: Chunk manifest metadata describing result file locations and checksums.
- **DAT-003**: Target DB load format compatible with bulk ingest.003: Target DB load format compatible with bulk ingest.

### Technology Platform Dependencies
- **PLT-001**: HTTPS-capable API platform for frontend/backend interaction.
- **PLT-002**: Messaging platform supporting durable delivery and redelivery behavior.
- **PLT-003**: Bulk-friendly data format such as Parquet.
- **PLT-004**: Database drivers that support streaming reads and bulk writes.
- **PLT-005**: Optional direct-streaming platform such as gRPC or Apache Arrow Flight.

### Compliance Dependencies
- **COM-001**: Data protection controls for high-volume result sets in transit and at rest.
- **COM-002**: Auditability of job execution and persistence completion events.
- **COM-003**: Operational policies for retention and deletion of intermediate result files.

Note: This section specifies required capabilities and integration dependencies rather than package or service versions.

## 9. Examples \& Edge Cases
// Example job submission response
HTTP/1.1 202 Accepted
{
  "jobId": "JOB-20260313-0001",
  "status": "SUBMITTED"
}

// Edge case A:
// The calculation engine retrieves 1,000,000 rows.
// Correct behavior: stream rows in batches, write chunked files, publish manifest.

// Edge case B:
// The completion event is delivered twice.
// Correct behavior: simulation engine detects already-processed chunks and avoids duplicate persistence.

// Edge case C:
// One Parquet file is corrupt or checksum validation fails.
// Correct behavior: mark job as PARTIAL_RETRY or FAILED and re-request or regenerate only the affected chunk.

// Edge case D:
// Target DB fails after 3 of 4 chunks were loaded.
// Correct behavior: resume from checkpoint or reconcile committed chunks without full job restart.

// Edge case E:
// Frontend user refreshes the page during processing.
// Correct behavior: frontend re-queries status using jobId; backend returns durable state.

// Edge case F:
// Direct gRPC streaming is used instead of object storage.
// Correct behavior: transfer occurs in bounded chunks with checkpointed acknowledgements and retry at chunk boundary.