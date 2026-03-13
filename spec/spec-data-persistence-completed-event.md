---
title: Data Contract Specification for Persistence Completed Event
version: 1.0
date_created: 2026-03-13
last_updated: 2026-03-13
owner: Application Architecture Team
tags: [data-contract, event, simulation, persistence, completion]
---

# Introduction

This specification defines the event contract published when `simulation-engine` finishes persisting the result dataset into the target database.

## 1. Purpose & Scope

This specification standardizes the `persistence.completed` payload used to confirm successful completion of target-database persistence.

### In Scope
- Completion event envelope and required fields
- Completion metadata used for orchestration and status updates
- Validation and acceptance criteria

### Out of Scope
- Database-specific persistence mechanics
- Partial failure events
- Broker-specific headers and routing metadata

### Intended Audience
- Backend developers
- Platform engineers
- SRE and operations teams
- AI coding agents

### Assumptions
- The event is published only after successful persistence.
- Upstream services use the event to mark the job completed.
- Persisted row count is measurable and emitted as metadata.

## 2. Definitions

- **Completion Event**: Metadata-only event indicating the target persistence phase finished successfully.
- **Target Dataset**: Logical storage location or table that received the result data.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The event shall include `jobId`, `correlationId`, and `systemId`.
- **REQ-002**: The event shall include `status` with value `COMPLETED`.
- **REQ-003**: The event shall include `persistedRowCount`.
- **REQ-004**: The event shall include `targetDataset` and `completedAt`.
- **REQ-005**: The event shall be emitted only after successful persistence commit semantics are satisfied.
- **SEC-001**: The event shall not expose sensitive row-level business data.
- **GUD-001**: `completedAt` should use an unambiguous timestamp format such as ISO-8601 UTC.
- **GUD-002**: `persistedRowCount` should be used by orchestrators for completion validation.

## 4. Interfaces & Data Contracts

### 4.1 Canonical Event Payload

```json
{
  "jobId": "JOB-20260313-0001",
  "correlationId": "0f44d8d7-4a9c-4c0c-96a1-95d8f0b42101",
  "systemId": "SYS-12345",
  "status": "COMPLETED",
  "persistedRowCount": 1000000,
  "targetDataset": "simulation_result",
  "completedAt": "2026-03-13T10:42:00Z"
}
```

### 4.2 Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `jobId` | string | Yes | Unique simulation job identifier |
| `correlationId` | string | Yes | Trace identifier across services |
| `systemId` | string | Yes | Requested business/system identifier |
| `status` | string | Yes | Expected value: `COMPLETED` |
| `persistedRowCount` | integer | Yes | Number of rows written to the target dataset |
| `targetDataset` | string | Yes | Logical table or dataset name |
| `completedAt` | string | Yes | Completion timestamp |

## 5. Acceptance Criteria

- **AC-001**: Given successful persistence, When the event is published, Then required identifiers are present.
- **AC-002**: Given a successful completion, When the event is emitted, Then `status` is `COMPLETED`.
- **AC-003**: Given a completed load, When metadata is reported, Then `persistedRowCount` is populated.
- **AC-004**: Given orchestration status updates, When the event is consumed, Then upstream systems can safely mark the job complete.
- **AC-005**: Given metadata-only contract expectations, When the event is emitted, Then no bulk result data is embedded.

## 6. Test Automation Strategy

- Validate presence of required fields.
- Validate `status` enumeration and timestamp format.
- Validate `persistedRowCount` is numeric and non-negative.
- Validate that the event contains no embedded row payload.

## 7. Rationale & Context

This event closes the end-to-end workflow. It allows the orchestration layer to move the job into a terminal completed state without needing to inspect the target database directly.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: `simulation-engine` publishes the event.
- **EXT-002**: Message broker delivers the event.
- **EXT-003**: `sim-engine-backend` or status service consumes the event.

## 9. Examples & Edge Cases

```code
// Edge case: persistedRowCount is zero unexpectedly
// Expected: consumer may flag anomaly for investigation before final business acceptance.

// Edge case: status is COMPLETED but completedAt is missing
// Expected: event rejected by contract validation.
```

## 10. Validation Criteria

- **VAL-001**: All required fields are present.
- **VAL-002**: `status` is `COMPLETED` for success cases.
- **VAL-003**: The event contains only completion metadata.
- **VAL-004**: Consumers can use the event to move the job to a terminal completed state.

## 11. Related Specifications / Further Reading

- `spec/README.md`
- `spec/spec-architecture-simulation-engine-integration.md`
- `spec/spec-process-job-lifecycle.md`
- `spec/spec-data-calculation-completed-event.md`
- `documentation/persistence-completed-event.json`
