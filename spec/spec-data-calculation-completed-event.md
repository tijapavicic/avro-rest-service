---
title: Data Contract Specification for Calculation Completed Event
version: 1.0
date_created: 2026-03-13
last_updated: 2026-03-13
owner: Application Architecture Team
tags: [data-contract, event, simulation, calculation, metadata]
---

# Introduction

This specification defines the event contract published by `calculation-engine` when bulk result data is ready for downstream processing by `simulation-engine`.

## 1. Purpose & Scope

This specification standardizes the `calculation.completed` payload used to announce that chunked result files are available for retrieval and persistence.

### In Scope
- Event envelope and required fields
- Chunk manifest structure
- Integrity and sizing metadata
- Validation and acceptance criteria

### Out of Scope
- Transport-specific broker headers
- Physical schema of the 50-column result set
- Storage lifecycle and retention policy

### Intended Audience
- Backend developers
- Data engineers
- Platform engineers
- AI coding agents

### Assumptions
- The event is delivered asynchronously.
- Result data is stored externally as chunked files, not embedded in the event.
- Consumers use this event to begin bulk ingestion.

## 2. Definitions

- **Manifest**: Metadata listing result chunks and their locations.
- **Chunk**: Independent subset of the total result data.
- **Checksum**: Integrity value used to validate chunk content before processing.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The event shall include `jobId`, `correlationId`, and `systemId`.
- **REQ-002**: The event shall include `status` with value `DATA_READY` when files are available.
- **REQ-003**: The event shall include `resultFormat`, `rowCount`, and `columnCount`.
- **REQ-004**: The event shall contain a `chunks` array with at least one entry.
- **REQ-005**: Each chunk shall include `chunkId`, `uri`, `checksum`, and `rowCount`.
- **REQ-006**: The total of chunk `rowCount` values should equal top-level `rowCount`.
- **SEC-001**: Chunk URIs shall reference protected storage locations.
- **SEC-002**: Consumers shall validate chunk checksums before persistence.
- **GUD-001**: Use stable chunk identifiers to support checkpointing and deduplication.
- **GUD-002**: Prefer Parquet for `resultFormat` unless a stronger requirement dictates otherwise.

## 4. Interfaces & Data Contracts

### 4.1 Canonical Event Payload

```json
{
  "jobId": "JOB-20260313-0001",
  "correlationId": "0f44d8d7-4a9c-4c0c-96a1-95d8f0b42101",
  "systemId": "SYS-12345",
  "status": "DATA_READY",
  "resultFormat": "parquet",
  "rowCount": 1000000,
  "columnCount": 50,
  "chunks": [
    {
      "chunkId": "part-0001",
      "uri": "s3://calc-results/JOB-20260313-0001/part-0001.parquet",
      "checksum": "sha256:abc123",
      "rowCount": 250000
    },
    {
      "chunkId": "part-0002",
      "uri": "s3://calc-results/JOB-20260313-0001/part-0002.parquet",
      "checksum": "sha256:def456",
      "rowCount": 250000
    }
  ]
}
```

### 4.2 Field Definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `jobId` | string | Yes | Unique simulation job identifier |
| `correlationId` | string | Yes | Trace identifier across services |
| `systemId` | string | Yes | Requested business/system identifier |
| `status` | string | Yes | Expected value: `DATA_READY` |
| `resultFormat` | string | Yes | File format for result chunks |
| `rowCount` | integer | Yes | Total result row count |
| `columnCount` | integer | Yes | Total result column count |
| `chunks` | array | Yes | Manifest of result chunk files |

### 4.3 Chunk Definition

| Field | Type | Required | Description |
|---|---|---|---|
| `chunkId` | string | Yes | Stable identifier for the chunk |
| `uri` | string | Yes | Storage location of the chunk |
| `checksum` | string | Yes | Integrity value for validation |
| `rowCount` | integer | Yes | Number of rows in this chunk |

## 5. Acceptance Criteria

- **AC-001**: Given a completed calculation, When the event is published, Then required identifiers are present.
- **AC-002**: Given data availability, When the payload is emitted, Then `status` is `DATA_READY`.
- **AC-003**: Given chunked output, When consumers parse the event, Then each chunk contains `chunkId`, `uri`, `checksum`, and `rowCount`.
- **AC-004**: Given consumer validation, When chunk checksums fail, Then the chunk is rejected for retry or regeneration.
- **AC-005**: Given the manifest, When totals are checked, Then aggregate chunk rows align with the top-level `rowCount`.

## 6. Test Automation Strategy

- Validate required fields are present.
- Validate `status` enumeration values.
- Validate chunk entries are structurally complete.
- Validate aggregate row counts in fixture-based tests.
- Validate checksum field presence in contract tests.

## 7. Rationale & Context

The event is intentionally small and metadata-only. Large result data is transferred via external chunked files rather than embedded in the message. This keeps messaging reliable while enabling high-volume data movement through bulk-friendly formats.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: Message broker delivering the event.
- **EXT-002**: Object storage holding result chunks.
- **EXT-003**: `simulation-engine` consuming the event.

## 9. Examples & Edge Cases

```code
// Edge case: empty chunks array
// Expected: event rejected as invalid.

// Edge case: rowCount total does not match sum of chunk rows
// Expected: event flagged for investigation or retry.

// Edge case: inaccessible URI
// Expected: consumer marks chunk retrieval as failed and retries per policy.
```

## 10. Validation Criteria

- **VAL-001**: All required fields are present.
- **VAL-002**: Chunk manifest entries are structurally complete.
- **VAL-003**: Top-level and per-chunk sizing metadata are consistent.
- **VAL-004**: Event remains metadata-only and does not embed bulk result rows.

## 11. Related Specifications / Further Reading

- `spec/README.md`
- `spec/spec-architecture-simulation-engine-integration.md`
- `spec/spec-process-job-lifecycle.md`
- `spec/spec-data-persistence-completed-event.md`
- `documentation/calculation-completed-event.json`
