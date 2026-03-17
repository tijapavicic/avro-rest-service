# Architecture Summary: Large Payload Processing System

## **Executive Summary**
This system processes large payloads (up to 1GB) through a dual-pipeline architecture that supports both next-generation and legacy processing paths simultaneously, using Kafka-based round-robin distribution to three parallel queues per pipeline for load balancing. The orchestrator receives HTTP-streamed JSON payloads from the frontend, publishes them to appropriate Kafka topics, where dedicated consumers forward messages to external processing engines that persist results to separate PostgreSQL databases. Failed messages are automatically routed to a Dead Letter Queue with exponential backoff retry logic (3 attempts: 30s, 90s, 270s), enabling resilient error handling and manual replay capabilities.

---

## **System Overview**
This is a **dual-path message processing architecture** that handles large payloads (up to 1GB) with both next-generation (NG) and legacy processing pipelines, including comprehensive error handling via Dead Letter Queue. The architecture is **fully configurable** and designed following cloud-native best practices, enabling seamless adoption of additional services into the processing flow—such as data enrichment, transformation, validation, or notification services—without disrupting existing pipelines.

---

## **Component Layers**

### **1. Frontend Layer**
- **simul-frontend**: User-facing component that initiates payload processing

### **2. Orchestration Layer**
- **simul-orchestrator**: 
  - Receives HTTP streaming requests with large payloads (1GB JSON)
  - Routes payloads to appropriate processing pipeline
  - Acts as the entry point to async processing

### **3. Message Broker (Dual-Pipeline Architecture)**

**Next-Generation Pipeline:**
- **`processingNG` topic** → Distributes to 3 round-robin queues:
  - `rr1-ng-queue`
  - `rr2-ng-queue`
  - `rr3-ng-queue`

**Legacy Pipeline:**
- **`processing` topic** → Distributes to 3 round-robin queues:
  - `rr1-queue`
  - `rr2-queue`
  - `rr3-queue`

**Error Handling:**
- **`payload.failed` (Dead Letter Queue)**: Receives failed messages from both pipelines

### **4. Consumer Layer**
- **processingNG-kafka-consumer**: Consumes from NG round-robin queues
- **processing-kafka-consumer**: Consumes from legacy round-robin queues

### **5. Processing Layer**
- **external-engineNG**: Processes NG pipeline messages
- **external-engine**: Processes legacy pipeline messages
- Both engines return HTTP 200 OK on successful persistence

### **6. Persistence Layer**
- **postgreNgDB**: Stores NG processed data
- **postgreDB**: Stores legacy processed data

---

## **Data Flow Sequence**

```
[1] Frontend → Orchestrator: HTTP Stream (1GB payload)
[2a] Orchestrator → processingNG Topic: Publish (NG path)
[2b] Orchestrator → processing Topic: Publish (Legacy path)
[3a] NG Consumer → external-engineNG: Forward
[3b] Legacy Consumer → external-engine: Forward
[4] Engines → Databases: Persist
[X] Consumers → DLQ: On failure after max retries
```

---

## **Sample Payload Structure**
```json
{
  "scenarionID": "550e8400-e29b-a716-4466554",
  "systemId": "SIM-01",
  "date": "2026-03-17",
  "items": [
    {"item1": 123, "item2": "alpha"},
    {"item1": 456, "item2": "beta"}
  ]
}
```

---

## **Dead Letter Queue (DLQ) Configuration**

### **Retry Strategy**
- **Max retries**: 3 attempts
- **Backoff**: Exponential (30s, 90s, 270s)

### **Failure Triggers**
- Deserialization errors (malformed payload)
- Business logic validation failures
- Persistent database errors
- HTTP 5xx responses from external engines

### **Monitoring & Operations**
- Alert threshold: DLQ depth > 10 messages
- Daily manual review process
- Replay capability for recovered messages

---

## **DLQ Consumer Architecture Recommendation**

### **Primary Recommendation: Dedicated DLQ Processor Service**

You should implement a **dedicated DLQ processor service** that is separate from your main processing consumers.

#### **Why Separate Service?**

**✅ Reliability (Primary Optimization)**
- Isolates error handling from main processing flow
- Prevents cascading failures
- Enables controlled retry strategies
- Allows for circuit breaker patterns

**✅ Operational Excellence**
- Centralized monitoring and alerting for failures
- Clear ownership and operational boundaries
- Easier debugging and log correlation
- Supports manual intervention workflows

**⚖️ Trade-off: Performance Efficiency**
- Additional service overhead
- Slightly higher latency for retry processing
- **Acceptable because**: DLQ processing is not on critical path

**⚖️ Trade-off: Cost Optimization**
- Additional compute resources required
- **Mitigated by**: Lower resource requirements (DLQ should be exception, not norm)

---

## **Recommended DLQ Processing Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   payload.failed (DLQ)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              dlq-processor-service                       │
│  • Polls DLQ periodically (not continuous)              │
│  • Classifies failure types                             │
│  • Routes to appropriate handler                        │
│  • Implements manual approval for replays               │
└────────┬────────────────┬────────────────┬──────────────┘
         │                │                │
         ↓                ↓                ↓
    [Auto-Retry]    [Manual Review]   [Archive]
         │                │                │
         ↓                ↓                ↓
   Republish to    Alert/Dashboard   Object Storage
   Original Topic   + Case System    (Compliance/Audit)
```

---

## **DLQ Processor Implementation Components**

### **1. DLQ Processor Service** (New Component)

**Responsibilities:**
- Poll `payload.failed` DLQ on configurable schedule (e.g., every 5 minutes)
- Classify failures by type:
  - **Transient** (network timeouts, temporary DB issues) → Auto-retry
  - **Poison messages** (schema violations) → Archive + Alert
  - **Business logic** (validation failures) → Manual review required
  - **Infrastructure** (DB down, service unavailable) → Hold + Alert
- Execute retry logic with exponential backoff
- Maintain retry attempt counts and metadata
- Provide REST API for manual replay operations

**Technical Implementation Example:**
```java
@Component
public class DLQProcessor {
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void processFailedMessages() {
        // Poll DLQ
        // Classify failures
        // Route to appropriate handler
    }
}

@RestController
@RequestMapping("/api/dlq")
public class DLQManagementController {
    
    @PostMapping("/replay/{messageId}")
    public ResponseEntity<?> manualReplay(@PathVariable String messageId) {
        // Manual replay with audit logging
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/stats")
    public DLQStatistics getStatistics() {
        // Dashboard metrics
        return dlqService.getStatistics();
    }
    
    @GetMapping("/failed-messages")
    public Page<FailedMessage> getFailedMessages(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        return dlqService.getFailedMessages(page, size);
    }
}
```

### **2. Monitoring Dashboard** (New Component)

**Responsibilities:**
- Real-time DLQ depth monitoring
- Failure classification breakdown
- Trend analysis (increasing failure rates = system issue)
- Manual intervention queue for operations team

**Key Metrics:**
- DLQ message count (current depth)
- Failure rate by type (transient, poison, business, infrastructure)
- Average time in DLQ
- Successful replay rate
- Top failure scenarios

### **3. Alert Rules**

| **Severity** | **Condition** | **Action** |
|--------------|---------------|------------|
| **Immediate** | DLQ depth > 10 messages | Page on-call engineer |
| **Warning** | Same failure pattern > 5 occurrences in 10 min | Create incident ticket |
| **Critical** | DLQ depth > 100 | Escalate to senior leadership |
| **Info** | Message in DLQ > 24 hours | Daily summary report |

---

## **Failure Classification Taxonomy**

### **Transient Failures** (Auto-Retry)
- Network timeouts
- Temporary database connection issues
- Rate limiting from external services
- Temporary resource exhaustion

**Action**: Automatic retry with exponential backoff (30s, 90s, 270s)

### **Poison Messages** (Archive + Alert)
- Schema validation failures
- Malformed JSON/Avro
- Encoding issues
- Size limit violations

**Action**: Archive to cold storage + alert development team

### **Business Logic Failures** (Manual Review)
- Data validation errors
- Business rule violations
- Referential integrity issues
- Invalid scenario IDs

**Action**: Queue for manual review by business analysts

### **Infrastructure Failures** (Hold + Alert)
- Database unavailable
- Processing service down
- Disk space exhausted
- Memory errors

**Action**: Hold messages, alert infrastructure team, resume once resolved

---

## **Key Architectural Patterns**

1. **Round-Robin Load Distribution**: Each topic fans out to 3 queues for parallel processing
2. **Dual Pipeline**: Simultaneous support for NG and legacy systems during migration
3. **Async Processing**: Decouples frontend from heavy processing via message broker
4. **Resilience**: Dead Letter Queue prevents message loss on failures
5. **Backpressure Handling**: Streaming + queue-based architecture manages large payloads

---

## **Critical Architectural Questions**

Before finalizing the DLQ consumer design, consider:

1. **Retry Strategy**: What's your target SLA for recovering failed messages?
   - Minutes? Hours? Next business day?
   
2. **Business Criticality**: Are all scenarios equally critical, or do some require priority processing?
   
3. **Compliance**: Do you have regulatory requirements for audit trails of failed processing attempts?

4. **Manual Intervention**: Who is the operational team that will handle manual reviews? Do they need a UI or API access?

5. **Message Ordering**: Do messages in DLQ need to maintain ordering when replayed?

---

## **Azure-Specific Recommendations**

### **For Kafka on Azure:**
- Consider **Azure Event Hubs** as managed alternative
- Use **Azure Container Apps** for the DLQ processor service
- Store archived failures in **Azure Blob Storage** (cool tier)
- Use **Azure Monitor Alerts** for DLQ depth thresholds
- Implement **Azure Application Insights** for distributed tracing

### **If Using Azure Service Bus:**
- Use **Azure Functions with Service Bus trigger** for DLQ processing
- Store failure metadata in **Azure Table Storage** (cost-effective)
- Use **Azure Monitor Workbooks** for DLQ dashboards
- Leverage built-in dead-letter queue features

---

## **Implementation Roadmap**

### **Phase 1: Foundation** (Week 1-2)
- [ ] Create DLQ processor service skeleton
- [ ] Define failure classification taxonomy
- [ ] Implement basic polling mechanism
- [ ] Add logging and basic metrics

### **Phase 2: Intelligence** (Week 3-4)
- [ ] Implement failure classification logic
- [ ] Add exponential backoff retry mechanism
- [ ] Create REST API for manual operations
- [ ] Set up monitoring dashboard

### **Phase 3: Operations** (Week 5-6)
- [ ] Configure alerting rules
- [ ] Create operations runbook
- [ ] Implement archive mechanism for poison messages
- [ ] Add audit trail for compliance

### **Phase 4: Optimization** (Week 7-8)
- [ ] Implement priority-based processing
- [ ] Add business rules engine for auto-classification
- [ ] Create self-healing capabilities for common transient failures
- [ ] Performance tuning and load testing

---

## **Operational Runbook**

### **Daily Operations**
1. Check DLQ dashboard for overnight failures
2. Review failure classification breakdown
3. Process manual review queue (business logic failures)
4. Archive resolved poison messages

### **Incident Response**
1. **DLQ Depth Spike**: Check for systemic issues (DB down, service degradation)
2. **Repeated Failures**: Analyze pattern, may indicate bug in recent deployment
3. **Message Stuck > 24h**: Escalate to product team for business decision

### **Weekly Review**
- Analyze failure trends
- Identify opportunities for preventive improvements
- Update failure classification rules based on new patterns
- Review archived messages for compliance

---

## **Technology Stack**
- **Message Broker**: Kafka
- **Database**: PostgreSQL (dual instances: NG + Legacy)
- **Communication**: HTTP for sync, Kafka for async
- **Payload Format**: JSON (Avro schema)
- **Payload Size**: Up to 1GB
- **Framework**: Spring Boot (based on repository structure)

---

## **Related Documentation**
- [Main Diagram](./data-flow-component-diagram-dot-lines-v2-ov.puml)
- [Architecture Decision Records](../../documentation/)
- [Operations Manual](../../how-to-run-me.md)

---

## **AI Prompt for Diagram Generation**

### **Purpose**
Use this prompt to regenerate or create variations of the architecture diagram using AI-powered diagramming tools (PlantUML, Mermaid, D2, etc.).

---

### **Diagram Generation Prompt**

```
Create a comprehensive component architecture diagram for a large payload processing system with the following specifications:

## System Context
- Architecture Type: Event-driven microservices with dual-pipeline support
- Payload Size: Up to 1GB JSON payloads
- Technology: Kafka message broker, PostgreSQL databases, Spring Boot services
- Pattern: Round-robin load distribution with Dead Letter Queue error handling

## Components to Include

### Frontend Layer
- Component: simul-frontend
- Role: User interface that initiates payload processing
- Connections: HTTP streaming to orchestrator

### Orchestration Layer
- Component: simul-orchestrator
- Role: Entry point for large payload ingestion (1GB JSON via HTTP streaming)
- Connections: 
  - Receives HTTP streams from frontend
  - Publishes to both processingNG and processing topics

### Message Broker (Kafka)
Implement dual-pipeline architecture:

**Next-Generation Pipeline:**
- Topic: processingNG
- Fan-out to 3 round-robin queues:
  - rr1-ng-queue
  - rr2-ng-queue
  - rr3-ng-queue

**Legacy Pipeline:**
- Topic: processing
- Fan-out to 3 round-robin queues:
  - rr1-queue
  - rr2-queue
  - rr3-queue

**Error Handling:**
- Dead Letter Queue: payload.failed
- Purpose: Receives failed messages from both pipelines
- Configuration: Max 3 retries with exponential backoff (30s, 90s, 270s)

### Consumer Layer
- Component: processingNG-kafka-consumer
  - Consumes from: rr1-ng-queue, rr2-ng-queue, rr3-ng-queue
  - Forwards to: external-engineNG
  - On failure: Sends to payload.failed DLQ

- Component: processing-kafka-consumer
  - Consumes from: rr1-queue, rr2-queue, rr3-queue
  - Forwards to: external-engine
  - On failure: Sends to payload.failed DLQ

### Processing Layer
- Component: external-engineNG
  - Receives: Payloads from processingNG-kafka-consumer
  - Processes: NG pipeline business logic
  - Persists to: postgreNgDB
  - Returns: HTTP 200 OK on success

- Component: external-engine
  - Receives: Payloads from processing-kafka-consumer
  - Processes: Legacy pipeline business logic
  - Persists to: postgreDB
  - Returns: HTTP 200 OK on success

### Persistence Layer
- Database: postgreNgDB (Next-generation data store)
- Database: postgreDB (Legacy data store)

### DLQ Processing (Optional - Show in Diagram)
- Component: dlq-processor-service
  - Consumes from: payload.failed DLQ
  - Classifies failures and routes to:
    - Auto-retry → Republish to original topic
    - Manual review → Alert dashboard
    - Archive → Object storage

## Sample Payload
```json
{
  "scenarionID": "550e8400-e29b-a716-4466554",
  "systemId": "SIM-01",
  "date": "2026-03-17",
  "items": [
    {"item1": 123, "item2": "alpha"},
    {"item1": 456, "item2": "beta"}
  ]
}
```

## Visual Design Requirements
- Use component boxes with clear labels
- Show data flow with directional arrows
- Label protocols on connections (HTTP, Kafka)
- Indicate message types (streaming, async)
- Use color coding:
  - Blue: NG pipeline components
  - Gray: Legacy pipeline components
  - Red: Error handling (DLQ)
  - Green: Successful persistence
- Show cardinality where relevant (1 topic → 3 queues)
- Include retry configuration annotations
- Add legend explaining symbols and colors

## Key Patterns to Highlight
1. Dual-pipeline architecture (NG and Legacy running in parallel)
2. Round-robin distribution for load balancing
3. Dead Letter Queue for resilience
4. Async decoupling via message broker
5. Separate persistence stores per pipeline

## Output Format
Generate a PlantUML component diagram with:
- Clear component boundaries
- Proper grouping (frontend, orchestration, broker, consumers, processors, persistence)
- Connection labels showing message types
- Annotations for retry logic and error handling
- Professional styling with consistent colors

## Additional Notes
- The architecture must support seamless addition of new services (enrichment, transformation, validation)
- Follow cloud-native best practices
- Emphasize configurability and extensibility
- Show both happy path and error path flows
```

---

### **Usage Instructions**

**For PlantUML:**
1. Copy the prompt above
2. Provide to AI with instruction: "Generate a PlantUML component diagram using the @startuml/@enduml syntax"
3. Save output as `.puml` file
4. Render using PlantUML CLI or IDE plugin

**For Mermaid:**
1. Copy the prompt above
2. Provide to AI with instruction: "Generate a Mermaid diagram using the flowchart or C4 diagram syntax"
3. Save output in markdown code block with `mermaid` language tag
4. Render using Mermaid CLI, GitHub, or visualization tool

**For D2:**
1. Copy the prompt above
2. Provide to AI with instruction: "Generate a D2 diagram with proper layout and styling"
3. Save output as `.d2` file
4. Render using D2 CLI

**For Structurizr:**
1. Copy the prompt above
2. Provide to AI with instruction: "Generate a Structurizr DSL workspace with C4 model hierarchy"
3. Save output as `workspace.dsl`
4. Render using Structurizr Lite or CLI

---

### **Example Command for Direct Generation**

```bash
# Using AI CLI tool with the prompt
ai-diagram-generator --input prompt.txt --format plantuml --output architecture-diagram.puml

# Or using GitHub Copilot Chat
# Open Copilot Chat and paste the prompt with instruction:
"Generate a PlantUML component diagram based on this specification"
```

---

**Last Updated**: March 17, 2026  
**Version**: 0.0.2-SNAPSHOT  
**Status**: Architecture Design Phase


