# Appendix A: Simulation Engine Architecture Documentation

## Overview

This appendix provides comprehensive PlantUML diagrams for the Simulation Engine's event-driven architecture, showing how large-scale simulations are processed asynchronously through distributed components with chunked data handling.

## Diagrams

### 1. Sequence Diagram
**File:** `appendix-a-sequence-diagram.puml`

**Purpose:** Shows the temporal flow of events and interactions

**Key Features:**
- ✅ **4 distinct phases**: Submission → Calculation → Persistence → Status Update
- ✅ **Event-driven flows**: simulation.requested, calculation.completed, persistence.completed
- ✅ **Async processing**: Clear activation bars showing component lifetimes
- ✅ **Polling/SSE options**: Status update mechanisms
- ✅ **Chunked data**: Object storage intermediate layer for Parquet files

**Use When:**
- Understanding event ordering
- Debugging flow issues
- Documenting API interactions
- Explaining async patterns

### 2. Flowchart/Component Diagram
**File:** `appendix-a-flowchart-diagram.puml`

**Purpose:** Shows system structure and component relationships

**Key Features:**
- ✅ **5 architectural layers**: Presentation, API, Message, Processing, Data
- ✅ **14 numbered flow steps**: Easy-to-follow data flow path
- ✅ **Component notes**: Responsibilities for each service
- ✅ **Message topics**: Breakdown of event types
- ✅ **Legend**: Benefits and design rationale

**Use When:**
- Onboarding new developers
- Architecture reviews
- System design discussions
- Planning scalability

## Architecture Components

### Presentation Layer
```
┌─────────────────────────┐
│ sim-engine-frontend     │
│ - Submit simulations    │
│ - Poll status          │
│ - Display results       │
└─────────────────────────┘
```

### API Layer
```
┌─────────────────────────┐
│ sim-engine-backend      │
│ - REST API endpoints    │
│ - Event publishing      │
│ - Status aggregation    │
└─────────────────────────┘
```

### Message Infrastructure
```
┌─────────────────────────┐
│ Message Broker          │
│ ├── simulation.requested│
│ ├── calculation.completed│
│ └── persistence.completed│
└─────────────────────────┘
```

### Processing Layer
```
┌─────────────────────────┐   ┌─────────────────────────┐
│ calculation-engine      │   │ simulation-engine       │
│ - Query source DB       │   │ - Load chunks           │
│ - Generate Parquet      │   │ - Bulk insert           │
│ - Write to object store │   │ - Publish completion    │
└─────────────────────────┘   └─────────────────────────┘
```

### Data Layer
```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Source DB    │   │ Object Store │   │ Simulation DB│
│ (Input data) │   │ (Parquet)    │   │ (Results)    │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Data Flow Sequence

### Phase 1: Submission
```
User → Frontend → Backend → Message Broker
                      ↓
                 HTTP 202 Accepted (simulation_id)
```

### Phase 2: Calculation
```
Message Broker → calculation-engine
                      ↓
            Query Source Database
                      ↓
         Stream results to memory
                      ↓
      Write Parquet chunks to Object Storage
                      ↓
    Publish calculation.completed event
```

### Phase 3: Persistence
```
Message Broker → simulation-engine
                      ↓
      Read Parquet chunks from Object Storage
                      ↓
         Bulk load to Simulation DB
                      ↓
    Publish persistence.completed event
```

### Phase 4: Status Update
```
Message Broker → Backend → Frontend → User
                                ↓
                      Display results
```

## Key Architectural Patterns

### 1. Event-Driven Architecture
- **Decoupling**: Components communicate via async events
- **Scalability**: Independent scaling of services
- **Resilience**: Message broker provides durability and retry

### 2. Chunked Data Processing
- **Memory efficiency**: Avoids loading entire result sets
- **Fault tolerance**: Failed chunks don't affect others
- **Parallelization**: Multiple chunks processed concurrently
- **Progress tracking**: Incremental completion visibility

### 3. Object Storage Intermediate Layer
- **Decoupling**: Calculation and persistence separated
- **Flexibility**: Different processing speeds supported
- **Reprocessing**: Failed persistence can retry from storage
- **Format**: Parquet provides columnar compression

### 4. Status Polling/SSE
- **Polling**: Simple, reliable, works everywhere
- **SSE**: Real-time updates, efficient for active users
- **Hybrid**: Both supported for different use cases

## Technology Choices

### Message Broker Options
- **Kafka**: High throughput, persistent, partitioned
- **RabbitMQ**: Flexible routing, AMQP standard
- **AWS SQS/SNS**: Managed, serverless, cost-effective

### Object Storage Options
- **S3**: Scalable, durable, industry standard
- **MinIO**: Self-hosted, S3-compatible
- **Azure Blob**: Azure-native, integrated

### Data Format
- **Parquet**: Columnar, compressed, efficient
- **Arrow IPC**: Zero-copy, fast serialization
- **Avro**: Row-based, schema evolution

## Performance Characteristics

### Latency
- **Submission**: < 100ms (HTTP 202 response)
- **Calculation**: Varies (depends on data size)
- **Persistence**: Varies (bulk load speed)
- **Total**: Minutes to hours for large simulations

### Throughput
- **Concurrent simulations**: Limited by broker/engines
- **Data volume**: TB-scale with chunking
- **Chunk size**: 100MB-1GB recommended

### Scalability
- **Horizontal**: Add more calculation/simulation engines
- **Vertical**: Increase chunk processing resources
- **Storage**: Object storage scales independently

## Generating Diagrams

### Prerequisites
```bash
# Install PlantUML
brew install plantuml  # macOS
apt-get install plantuml  # Linux

# Or download from https://plantuml.com/download
```

### Generate PNG
```bash
cd documentation/v2

# Generate all diagrams
plantuml *.puml

# Generate specific diagram
plantuml appendix-a-sequence-diagram.puml
```

### Generate SVG (Scalable)
```bash
plantuml -tsvg appendix-a-sequence-diagram.puml
plantuml -tsvg appendix-a-flowchart-diagram.puml
```

### Generate ASCII (Terminal-friendly)
```bash
plantuml -ttxt appendix-a-sequence-diagram.puml
```

### IDE Integration
**IntelliJ IDEA:**
1. Install "PlantUML Integration" plugin
2. Right-click `.puml` file → "Open in PlantUML Preview"

**VS Code:**
1. Install "PlantUML" extension
2. Open `.puml` file → Press `Alt+D` for preview

## Comparison with Alternatives

### vs Appendix C (Direct Streaming)
| Aspect | Appendix A (Chunked) | Appendix C (Streaming) |
|--------|---------------------|------------------------|
| **Latency** | Higher (2 stages) | Lower (1 stage) |
| **Coupling** | Loose (async) | Tight (streaming) |
| **Storage** | Requires object store | No intermediate storage |
| **Fault tolerance** | High (chunks persist) | Lower (stream must succeed) |
| **Complexity** | Higher | Lower |
| **Best for** | Large, batch simulations | Real-time, continuous flows |

## Troubleshooting

### Common Issues

**Diagram won't render:**
```bash
# Check PlantUML syntax
plantuml -syntax appendix-a-sequence-diagram.puml

# Test with simple diagram
echo "@startuml\nAlice -> Bob: Hello\n@enduml" | plantuml -pipe > test.png
```

**Out of memory errors:**
```bash
# Increase Java heap for large diagrams
export _JAVA_OPTIONS="-Xmx2048m"
plantuml appendix-a-flowchart-diagram.puml
```

**Fonts missing:**
```bash
# Install graphviz for better font support
brew install graphviz  # macOS
apt-get install graphviz  # Linux
```

## Best Practices

### When to Update
- ✅ Adding/removing components
- ✅ Changing event schemas
- ✅ Modifying data flow paths
- ✅ Updating technology choices
- ✅ Changing integration patterns

### Update Workflow
1. Update sequence diagram (shows flow)
2. Update component diagram (shows structure)
3. Regenerate PNG/SVG exports
4. Update this README if needed
5. Verify cross-references

### Documentation Standards
- Keep diagrams synchronized
- Use consistent naming
- Include explanatory notes
- Add legends for complex flows
- Document assumptions

## Related Documentation

- **[Appendix C](appendix-c-README.md)**: Direct streaming alternative
- **[Data Flow](data-flow-README.md)**: Large payload processing
- **[Main README](../readme.md)**: Documentation index
- **[Event Schemas](../calculation-completed-event.json)**: Event payload formats

## Contributing

### Proposing Changes
1. Discuss architecture changes in issues
2. Update PlantUML diagrams
3. Regenerate exports
4. Update README
5. Submit PR with all changes

### Review Checklist
- [ ] Diagrams render correctly
- [ ] All components labeled
- [ ] Flow directions clear
- [ ] Notes explain non-obvious flows
- [ ] Legend updated if needed
- [ ] Cross-references valid
- [ ] Exports regenerated

---

**Version:** 2.0  
**Last Updated:** March 17, 2026  
**Maintainer:** Architecture Team

