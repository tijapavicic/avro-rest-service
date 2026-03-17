# Appendix C: Direct Streaming Alternative Architecture

## Overview

This appendix documents the **direct streaming alternative** to the chunked object storage approach (Appendix A). Instead of writing intermediate Parquet files, this architecture streams data directly from calculation-engine to simulation-engine using gRPC streaming or Apache Arrow Flight.

## Diagrams

### 1. Sequence Diagram
**File:** `appendix-c-sequence-diagram.puml`

**Purpose:** Shows temporal flow with direct streaming

**Key Features:**
- ✅ **Eliminated intermediate storage**: No object storage layer
- ✅ **Direct streaming**: gRPC or Arrow Flight between engines
- ✅ **Lower latency**: Single data transfer stage
- ✅ **Tighter coupling**: Engines communicate directly
- ✅ **Streaming bulk load**: Continuous data flow to database

**Use When:**
- Understanding streaming architecture
- Comparing with chunked approach
- Evaluating real-time requirements
- Planning low-latency systems

### 2. Flowchart/Component Diagram
**File:** `appendix-c-flowchart-diagram.puml`

**Purpose:** Shows system structure without object storage

**Key Features:**
- ✅ **Simplified architecture**: Fewer components
- ✅ **Direct connections**: calculation-engine → simulation-engine
- ✅ **Technology options**: gRPC vs Arrow Flight
- ✅ **Comparison legend**: Differences from Appendix A
- ✅ **Tradeoff analysis**: Benefits and limitations

**Use When:**
- Architecture decision-making
- Cost-benefit analysis
- Technology selection
- System simplification discussions

## Architecture Components

### Presentation Layer
```
┌─────────────────────────┐
│ sim-engine-frontend     │
│ - Submit simulations    │
│ - Poll job status       │
└─────────────────────────┘
```

### API Layer
```
┌─────────────────────────┐
│ sim-engine-backend      │
│ - REST API endpoints    │
│ - Event coordination    │
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

### Processing Layer (Direct Streaming)
```
┌─────────────────────────┐         ┌─────────────────────────┐
│ calculation-engine      │─────────│ simulation-engine       │
│ - Query source DB       │  gRPC   │ - Receive stream        │
│ - Stream results        │   or    │ - Bulk insert           │
│ - No local storage      │  Arrow  │ - Publish completion    │
└─────────────────────────┘  Flight └─────────────────────────┘
```

### Data Layer
```
┌──────────────┐               ┌──────────────┐
│ Source DB    │               │ Simulation DB│
│ (Input data) │               │ (Results)    │
└──────────────┘               └──────────────┘
```

**Note:** No object storage intermediate layer

## Data Flow Sequence

### Phase 1: Submission
```
User → Frontend → Backend → Message Broker
                      ↓
                 HTTP 202 Accepted (simulation_id)
```

### Phase 2: Direct Streaming & Persistence
```
Message Broker → calculation-engine
                      ↓
            Query Source Database
                      ↓
         Stream results via gRPC/Arrow Flight
                      ↓
              simulation-engine
                      ↓
         Bulk load to Simulation DB
                      ↓
    Publish completion events
```

### Phase 3: Status Update
```
Message Broker → Backend → Frontend → User
                                ↓
                      Display results
```

## Key Architectural Patterns

### 1. Direct Streaming
- **No intermediate storage**: Data flows directly between engines
- **Lower latency**: Single transfer stage
- **Network dependency**: Requires stable connection
- **Backpressure**: Consumer controls flow rate

### 2. Technology Options

#### Option A: gRPC Streaming
```protobuf
service SimulationStream {
  rpc StreamResults(ResultRequest) returns (stream ResultChunk);
}
```

**Pros:**
- ✅ Bidirectional streaming
- ✅ Built-in flow control
- ✅ Language agnostic
- ✅ HTTP/2 multiplexing

**Cons:**
- ❌ Additional protocol complexity
- ❌ Requires gRPC infrastructure
- ❌ Learning curve

#### Option B: Apache Arrow Flight
```python
# High-performance columnar streaming
flight_client.do_get(ticket)
```

**Pros:**
- ✅ Optimized for columnar data
- ✅ Zero-copy transfers
- ✅ Built-in compression
- ✅ High throughput

**Cons:**
- ❌ Less mature ecosystem
- ❌ Limited to columnar formats
- ❌ Requires Arrow libraries

### 3. Event-Driven Coordination
- **Still async**: Message broker coordinates lifecycle
- **Completion events**: Both engines publish progress
- **Status tracking**: Backend aggregates states

## Comparison: Appendix A vs Appendix C

| Aspect | Appendix A (Chunked) | Appendix C (Streaming) |
|--------|---------------------|------------------------|
| **Latency** | Higher (2 stages) | Lower (1 stage) |
| **Storage Cost** | Higher (object storage) | Lower (no intermediate) |
| **Network Dependency** | Lower (async) | Higher (streaming) |
| **Fault Tolerance** | High (chunks persist) | Lower (must retry full stream) |
| **Complexity** | Higher (3 data stores) | Lower (2 data stores) |
| **Reprocessing** | Easy (chunks available) | Hard (must re-query) |
| **Parallelization** | Easy (chunk-level) | Limited (stream-level) |
| **Backpressure** | Natural (queue-based) | Explicit (protocol-level) |
| **Best for** | Large batch jobs | Real-time streaming |

## When to Use Direct Streaming

### ✅ Good Fit
- **Real-time requirements**: Low latency needed
- **Streaming data**: Continuous data flows
- **Cost-sensitive**: Object storage costs prohibitive
- **Small-to-medium datasets**: Fit in memory/stream buffers
- **Stable network**: Reliable connectivity available

### ❌ Poor Fit
- **Large batch jobs**: TB-scale data processing
- **Unreliable network**: Frequent disconnections
- **Reprocessing needs**: Must replay failed operations
- **Independent scaling**: Calculation and persistence at different rates
- **Fault tolerance critical**: Can't afford stream failures

## Implementation Considerations

### gRPC Streaming Implementation

**calculation-engine (Server):**
```java
@Override
public void streamResults(ResultRequest request, 
                         StreamObserver<ResultChunk> responseObserver) {
    try (ResultSet rs = querySourceDB(request)) {
        while (rs.next()) {
            ResultChunk chunk = buildChunk(rs);
            responseObserver.onNext(chunk);
        }
        responseObserver.onCompleted();
    } catch (Exception e) {
        responseObserver.onError(e);
    }
}
```

**simulation-engine (Client):**
```java
StreamObserver<ResultChunk> observer = new StreamObserver<>() {
    @Override
    public void onNext(ResultChunk chunk) {
        bulkInsert(chunk);  // Stream to database
    }
    
    @Override
    public void onCompleted() {
        publishCompletionEvent();
    }
};

stub.streamResults(request, observer);
```

### Arrow Flight Implementation

**calculation-engine (Server):**
```python
class SimulationFlightServer(FlightServerBase):
    def do_get(self, context, ticket):
        # Query source database
        df = query_source_db(ticket.ticket)
        
        # Stream as Arrow table
        table = pa.Table.from_pandas(df)
        return FlightDataStream(table)
```

**simulation-engine (Client):**
```python
flight_client = FlightClient("grpc://calculation-engine:8815")

# Stream results
reader = flight_client.do_get(ticket)
table = reader.read_all()

# Bulk load to database
bulk_insert(table)
```

## Performance Characteristics

### Latency
- **Submission**: < 100ms (HTTP 202)
- **Streaming**: Real-time (as data flows)
- **Persistence**: Concurrent with streaming
- **Total**: Lower than chunked approach

### Throughput
- **Network bound**: Limited by bandwidth
- **Memory bound**: Limited by buffer sizes
- **CPU bound**: Serialization/deserialization overhead

### Scalability
- **Horizontal**: More engine pairs (1:1 ratio)
- **Vertical**: Larger network pipes
- **Limited parallelization**: Single stream per simulation

## Monitoring & Observability

### Key Metrics
```yaml
Metrics:
  - stream_duration_seconds
  - bytes_transferred_total
  - stream_errors_total
  - backpressure_events_total
  - rows_per_second
  - network_latency_ms
```

### Health Checks
- **Stream connectivity**: Periodic ping/pong
- **Backpressure**: Monitor buffer levels
- **Error rates**: Track stream failures
- **Throughput**: Rows/bytes per second

## Error Handling

### Stream Failures
```
calculation-engine stream error
         ↓
simulation-engine receives error
         ↓
Publish failure event to broker
         ↓
Backend marks simulation as failed
         ↓
User notified of failure
         ↓
Retry logic or manual re-submission
```

### Retry Strategies
- **Transient errors**: Automatic retry with backoff
- **Permanent errors**: Mark as failed, alert ops
- **Partial failures**: Checkpoint progress if possible

## Security Considerations

### Transport Security
- **TLS encryption**: Encrypt streaming data
- **Mutual TLS**: Authenticate both engines
- **Token-based auth**: JWT or OAuth tokens

### Data Protection
- **Encryption in transit**: TLS 1.3
- **Data validation**: Schema validation at receiver
- **Audit logging**: Track all stream operations

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

plantuml appendix-c-sequence-diagram.puml
plantuml appendix-c-flowchart-diagram.puml
```

### Generate SVG
```bash
plantuml -tsvg appendix-c-*.puml
```

### IDE Integration
Same as Appendix A (see appendix-a-README.md)

## Migration Path

### From Appendix A to Appendix C

**Step 1: Implement Streaming Protocol**
```
Add gRPC/Arrow Flight support to both engines
Test with small datasets
```

**Step 2: Feature Flag**
```
Add configuration to toggle between chunked and streaming
Run both in parallel for validation
```

**Step 3: Gradual Rollout**
```
Enable streaming for small simulations
Monitor performance and errors
Expand to larger simulations
```

**Step 4: Deprecate Object Storage**
```
Stop writing new chunks to object storage
Clean up old Parquet files
Remove object storage dependencies
```

## Related Documentation

- **[Appendix A](appendix-a-README.md)**: Chunked object storage approach
- **[Data Flow](data-flow-README.md)**: Large payload processing
- **[Main README](../readme.md)**: Documentation index

## Decision Factors

### Choose Appendix A (Chunked) If:
- Large datasets (TB-scale)
- Need reprocessing capability
- Unreliable network
- Independent engine scaling
- Fault tolerance critical

### Choose Appendix C (Streaming) If:
- Real-time requirements
- Low latency needed
- Cost optimization priority
- Stable network infrastructure
- Smaller datasets

---

**Version:** 2.0  
**Last Updated:** March 17, 2026  
**Maintainer:** Architecture Team

