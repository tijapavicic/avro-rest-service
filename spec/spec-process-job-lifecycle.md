---
title: Process Specification for Simulation Job Lifecycle
version: 1.0
date_created: 2026-03-13
last_updated: 2026-03-13
owner: Application Architecture Team
tags: [process, simulation, lifecycle, retries, idempotency, resilience]
---

# Introduction

This specification captures the lifecycle, retry rules, checkpointing model, idempotency behavior, and failure recovery process for simulation jobs executed across `sim-engine-backend`, `calculation-engine`, and `simulation-engine`.

## 1. Purpose & Scope

This specification standardizes how simulation jobs move from submission to completion or failure, including duplicate-delivery handling and chunk-level recovery for large datasets.

### In Scope
- Job creation and correlation requirements
- Lifecycle state model
- Chunk checkpointing rules
- Retry and backoff rules
- Duplicate-delivery handling
- Poison-message handling
- Operator visibility requirements

### Out of Scope
- Concrete implementation of broker dead-letter queues
- Vendor-specific database syntax
- UI rendering details for job progress

### Intended Audience
- Backend developers
- Platform engineers
- SRE and operations teams
- Architects
- AI coding agents

### Assumptions
- Jobs are asynchronous.
- Large datasets are handled in chunks.
- Job progress must survive process restarts.
- Duplicate delivery is normal in distributed systems and must be tolerated.

## 2. Definitions

- **Checkpoint**: Durable progress record indicating completed work for a chunk or phase.
- **Deduplication Key**: Stable identifier used to prevent duplicate processing.
- **Poison Message**: Message that repeatedly fails processing and requires quarantine.
- **Retry Budget**: Maximum number of automatic retries allowed before escalation.
- **Backoff**: Increasing delay applied between retries.
- **Chunk State**: Status of an individual chunk independent of the overall job state.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Every simulation request shall create a durable `jobId`.
- **REQ-002**: Every downstream command and event shall include `jobId` and `correlationId`.
- **REQ-003**: The lifecycle shall support at minimum `SUBMITTED`, `QUEUED`, `RUNNING`, `DATA_READY`, `PERSISTING`, `COMPLETED`, and `FAILED` states.
- **REQ-004**: Chunk-level checkpoints shall be stored durably.
- **REQ-005**: Duplicate delivery of commands or events shall not result in duplicate target writes.
- **REQ-006**: Automatic retry shall occur at chunk or message granularity, not full-job granularity, unless the state is unrecoverable.
- **REQ-007**: A failed chunk shall be identifiable independently of other completed chunks.
- **REQ-008**: Operators shall be able to determine the last successful phase for any `jobId`.

- **REL-001**: Retry policies shall distinguish transient failures from permanent failures.
- **REL-002**: Retryable failures shall use bounded retry counts and backoff.
- **REL-003**: Poison messages shall be quarantined after retry budget exhaustion.
- **REL-004**: A job may transition to `PARTIAL_RETRY` when only a subset of chunks require reprocessing.

- **SEC-001**: Lifecycle state changes shall be auditable.
- **SEC-002**: Operator repair actions shall be attributable to an authenticated actor or service account.

- **CON-001**: Completed chunks shall not be reloaded unless an explicit repair or rollback decision requires it.
- **CON-002**: Failed chunks shall not invalidate already completed chunks unless data consistency rules require a full rollback.

- **GUD-001**: Use `jobId + chunkId` as the deduplication key.
- **GUD-002**: Store per-chunk checksum and row-count metadata.
- **GUD-003**: Prefer forward-only recovery from checkpoint rather than full restart.

- **PAT-001**: Maintain separate state for job status and chunk status.
- **PAT-002**: Treat duplicate events as expected operating conditions, not exceptional conditions.

## 4. Interfaces & Data Contracts

### 4.1 Lifecycle Event Contract

```json
{
  "jobId": "JOB-20260313-0001",
  "correlationId": "0f44d8d7-4a9c-4c0c-96a1-95d8f0b42101",
  "eventType": "chunk.persisted",
  "state": "PERSISTING",
  "chunkId": "part-0001",
  "attempt": 2,
  "occurredAt": "2026-03-13T10:30:00Z"
}
```

### 4.2 Checkpoint Record

| Field | Description |
|---|---|
| `jobId` | Simulation job identifier |
| `chunkId` | Chunk identifier |
| `phase` | Current processing phase |
| `status` | `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` |
| `attemptCount` | Number of attempts made |
| `checksum` | Integrity value for chunk |
| `rowCount` | Expected row count |
| `updatedAt` | Last update timestamp |

### 4.3 Retry Policy Contract

| Failure Type | Retryable | Granularity | Example Handling |
|---|---|---|---|
| transient DB timeout | Yes | chunk | exponential backoff and retry |
| broker redelivery | Yes | message | deduplicate using `jobId + chunkId` |
| checksum mismatch | Conditional | chunk | regenerate or re-fetch chunk |
| schema mismatch | No | job | fail and escalate |
| poison message | No after retry budget exhaustion | message | dead-letter or quarantine |

## 5. Acceptance Criteria

- **AC-001**: Given duplicate delivery of a completion event, When the simulation engine evaluates chunk state, Then already-completed chunks are not loaded again.
- **AC-002**: Given a transient target DB failure, When retry policy is applied, Then only the affected chunk is retried.
- **AC-003**: Given retry budget exhaustion, When the failure persists, Then the job transitions to `FAILED` and the failing message is quarantined or escalated.
- **AC-004**: Given a partially completed job, When an operator inspects status, Then the last successful phase and chunk progress are visible.
- **AC-005**: Given a checksum mismatch, When the chunk is validated, Then the chunk is rejected and marked for retry or regeneration.

## 6. Test Automation Strategy

- **Test Levels**: Unit, integration, resilience.
- **Frameworks**: Broker integration tests, persistence integration tests, and failure-injection tests.
- **Test Data Management**: Deterministic chunk manifests and replayable duplicate events.
- **CI/CD Integration**: Run automated duplicate-delivery, retry, and checkpoint-recovery tests in CI.
- **Coverage Requirements**: Cover all lifecycle transitions and failure branches.
- **Performance Testing**: Validate checkpoint overhead remains bounded under expected chunk counts.

Suggested scenarios:
- same event delivered twice
- chunk persisted then retry arrives
- target DB unavailable for a bounded period
- checksum mismatch on one chunk
- retry budget exhausted for one chunk
- operator resumes from partial completion

## 7. Rationale & Context

Large dataset workflows fail in partial and non-deterministic ways. A durable lifecycle and checkpoint model is required so operators and services can recover work incrementally rather than restart entire jobs. The core principle is to make each chunk independently traceable, retryable, and deduplicated.

This reduces:
- unnecessary recomputation
- duplicate inserts
- operational ambiguity
- blast radius of partial failure

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: Message broker used for command and event delivery.
- **EXT-002**: Durable state store used for job and chunk checkpoints.
- **EXT-003**: Target database for persisted simulation results.

### Third-Party Services
- **SVC-001**: Dead-letter or quarantine capability for poison messages.
- **SVC-002**: Monitoring and alerting system for failed jobs and retry exhaustion.

### Infrastructure Dependencies
- **INF-001**: Log aggregation and tracing with `jobId` and `correlationId` searchability.
- **INF-002**: Durable storage for checkpoint records.
- **INF-003**: Time synchronization across services for reliable event ordering analysis.

### Data Dependencies
- **DAT-001**: Chunk manifest records.
- **DAT-002**: Chunk checksum and row-count metadata.
- **DAT-003**: Job lifecycle state records.

### Technology Platform Dependencies
- **PLT-001**: Messaging platform with redelivery semantics.
- **PLT-002**: Durable storage for checkpoints.
- **PLT-003**: Target DB capable of chunk-safe persistence and reconciliation.

### Compliance Dependencies
- **COM-001**: Audit trail requirements for lifecycle transitions and operator interventions.

**Note**: This section describes required capabilities rather than concrete packages or versions.

## 9. Examples & Edge Cases

```code
// Edge case: duplicate message delivery
// Expected: same jobId + chunkId resolves to no-op if checkpoint is COMPLETED.

// Edge case: target DB unavailable for 10 minutes
// Expected: bounded retries with backoff, then FAILED or operator escalation.

// Edge case: one chunk corrupt, others valid
// Expected: retry or regenerate the corrupt chunk only.

// Edge case: checkpoint store unavailable temporarily
// Expected: do not mark a chunk or job complete until checkpoint write succeeds.
```

## 10. Validation Criteria

- **VAL-001**: Jobs have durable lifecycle state records.
- **VAL-002**: Chunks have durable checkpoint records.
- **VAL-003**: Duplicate events do not cause duplicate persisted data.
- **VAL-004**: Failed chunks can be retried independently.
- **VAL-005**: Operators can identify the last successful phase and the failing chunk.

## 11. Related Specifications / Further Reading

- `spec/README.md`
- `spec/spec-architecture-simulation-engine-integration.md`
- `spec/spec-data-calculation-completed-event.md`
- `spec/spec-data-persistence-completed-event.md`
- `documentation/appendix-b-recommended-sequence-diagram.mmd`
- Message broker retry and dead-letter documentation
- Target database transaction and bulk-load documentation

