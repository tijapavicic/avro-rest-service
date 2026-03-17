# Specification Index

This folder contains the project specifications created from the prior design discussions in this repository.

## Recommended reading order

1. [`spec-architecture-simulation-engine-integration.md`](./spec-architecture-simulation-engine-integration.md)
2. [`spec-process-job-lifecycle.md`](./spec-process-job-lifecycle.md)
3. [`spec-data-calculation-completed-event.md`](./spec-data-calculation-completed-event.md)
4. [`spec-data-persistence-completed-event.md`](./spec-data-persistence-completed-event.md)

## Spec map

| Spec | Purpose | Related diagrams/examples |
|---|---|---|
| [`spec-architecture-simulation-engine-integration.md`](./spec-architecture-simulation-engine-integration.md) | End-to-end protocol and integration design for frontend, backend, calculation engine, storage, and simulation engine. | [`appendix-a-recommended-architecture-diagram.mmd`](../documentation/appendix-a-recommended-architecture-diagram.mmd), [`appendix-b-recommended-sequence-diagram.mmd`](../documentation/appendix-b-recommended-sequence-diagram.mmd), [`appendix-c-direct-streaming-alternative-diagram.mmd`](../documentation/appendix-c-direct-streaming-alternative-diagram.mmd) |
| [`spec-process-job-lifecycle.md`](./spec-process-job-lifecycle.md) | Job states, retries, checkpoints, deduplication, and recovery behavior. | [`appendix-b-recommended-sequence-diagram.mmd`](../documentation/appendix-b-recommended-sequence-diagram.mmd) |
| [`spec-data-calculation-completed-event.md`](./spec-data-calculation-completed-event.md) | Contract for the `calculation.completed` metadata event. | [`calculation-completed-event.json`](../documentation/calculation-completed-event.json) |
| [`spec-data-persistence-completed-event.md`](./spec-data-persistence-completed-event.md) | Contract for the `persistence.completed` metadata event. | [`persistence-completed-event.json`](../documentation/persistence-completed-event.json) |

## Document conventions

- Spec files use the `spec-*.md` naming convention.
- Support artifacts in `documentation/` use lowercase kebab-case filenames for stable links.
- Relative links should be preferred when referencing local specs and supporting artifacts.
- Mermaid `.mmd` files are the source of truth for standalone diagrams.

## Date Representation In Samples

- `payload_sample_iso.json` uses an ISO-8601 date string (`YYYY-MM-DD`), which is human-readable and aligns with JSON Schema `format: date`.
- `payload_sample.json` uses Avro `logicalType: "date"` encoded as an `int` (number of days since `1970-01-01`).
- Both files represent the same business payload shape; only the date wire format differs.
