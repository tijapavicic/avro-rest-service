---
title: Architecture Specification for Avro REST Service
version: 1.0
date_created: 2026-03-13
last_updated: 2026-03-13
owner: Application Engineering Team
tags: [architecture, spring-boot, avro, security, process]
---

# Introduction

This specification defines architecture, interface contracts, security controls, and quality gates for the Avro REST Service. It is self-contained and intended for developers, reviewers, and automation agents.

## 1. Purpose & Scope

This specification standardizes implementation and review for the Spring Boot Avro REST service.

In scope:
- Java package and layering conventions.
- Avro schema lifecycle and generated model handling.
- REST endpoint and media-type contracts.
- Build/test/security quality gates.
- Security constraints for request handling and configuration.

Out of scope:
- Non-HTTP transports.
- Infrastructure provisioning outside repository boundaries.

Audience:
- Application developers.
- Security and code reviewers.
- CI/CD and AI automation agents.

Assumptions:
- Maven is used for build and verification.
- Avro sources are generated during build lifecycle.
- Canonical package root is `com.example.avro`.

## 2. Definitions

- **API**: Application Programming Interface.
- **Avro**: Schema-based serialization system.
- **CORS**: Cross-Origin Resource Sharing.
- **CVE**: Common Vulnerabilities and Exposures.
- **OWASP**: Open Worldwide Application Security Project.
- **Schema-first**: Workflow where `.avsc` changes precede generated and application code changes.
- **Generated sources**: Build artifacts under `target/generated-sources/avro`.
- **`timestamp-millis`**: Avro logical type mapping to `java.time.Instant` in generated Java model.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: Java source shall remain under package root `com.example.avro`.
- **REQ-002**: Controllers shall reside in `api` package.
- **REQ-003**: Configuration classes shall reside in `config` package.
- **REQ-004**: Avro schema shall be the source of truth for model contracts.
- **REQ-005**: API shall support `application/avro` and `application/avro+json`.
- **REQ-006**: If `createdAt` is missing, service logic shall set current `Instant`.

- **SEC-001**: Hardcoded credentials/tokens/secrets are prohibited.
- **SEC-002**: Request payloads shall be validated before processing.
- **SEC-003**: CORS configuration shall be explicit and non-permissive.
- **SEC-004**: Actuator exposure shall be minimal and explicit.
- **SEC-005**: HIGH/CRITICAL dependency findings are release blockers.

- **CON-001**: Do not manually edit `target/generated-sources/avro`.
- **CON-002**: Changes to `src/main/avro/user_event.avsc` require source regeneration.
- **CON-003**: Pull requests shall be focused and minimal-diff.
- **CON-004**: Prefer patch/minor upgrades for vulnerability remediation unless major is required.

- **GUD-001**: Security/dependency notes should include dependency, CVE/severity, minimum fixed version, compatibility risk.
- **GUD-002**: Run verification before vulnerability scanning.

- **PAT-001**: Follow schema-first workflow.
- **PAT-002**: Treat generation and scanning as CI-enforced quality gates.

## 4. Interfaces & Data Contracts

### 4.1 REST Interfaces

| Interface ID | Method | Path | Request Media Types | Response Media Types | Description |
|---|---|---|---|---|---|
| API-001 | POST | `/api/users` | `application/avro`, `application/avro+json` | `application/avro`, `application/avro+json` | Create user event |
| API-002 | GET | `/api/users/{id}` | N/A | `application/avro`, `application/avro+json` | Retrieve user event by id |

### 4.2 Data Contract

Authoritative schema:
- `src/main/avro/user_event.avsc`

Generated model:
- `target/generated-sources/avro/com/example/avro/model/UserEvent.java`

Representative Avro JSON payload:

```json
{
  "id": "u-1",
  "name": "Ada",
  "age": 31,
  "createdAt": 1710000000000
}
```

Contract notes:
createdAt logical type is timestamp-millis.
Generated Java type for createdAt is java.time.Instant.
Null createdAt input is allowed; service sets default timestamp.
5. Acceptance Criteria
   AC-001: Given a valid payload, When POST /api/users is called, Then response is Avro-compatible and contract-valid.
   AC-002: Given createdAt is absent, When create request is processed, Then createdAt is set to non-null current timestamp.
   AC-003: Given an existing id, When GET /api/users/{id} is called, Then corresponding user event is returned in requested media type.
   AC-004: Given schema changes, When generation/build runs, Then generated model compiles and reflects schema updates.
   AC-005: Given dependency changes, When OWASP scan runs, Then no unresolved HIGH/CRITICAL findings remain.
   AC-006: Given security/dependency PR updates, When review notes are produced, Then required vulnerability metadata is present.
6. Test Automation Strategy
   Test Levels: Unit, integration, API contract tests.
   Frameworks: JUnit 5, Spring Boot Test, Maven Surefire/Failsafe.
   Test Data Management: Deterministic Avro JSON fixtures; isolated test state.
   CI/CD Integration: Run required checks on PR and main branches.
   Coverage Requirements: New/changed controller and config behavior must include tests.
   Performance Testing: Optional smoke performance checks on core endpoints.
   Security Testing: OWASP dependency check required for dependency/security-sensitive changes.
```shell
 mvn -B clean verify
mvn -B org.owasp:dependency-check-maven:check
```
8.