# Bulk CSV Import - Technical Decision Document

**Principal Engineer Analysis**  
**Date:** March 22, 2026  
**Context:** Async Bulk Data Import for 500K Row CSV Processing  
**Project:** Spring Boot Avro REST Service

---

## Use Case Summary

### Requirements
- **Input:** CSV file with 500,000 rows and 10 columns
- **Processing Model:** Asynchronous (fire-and-forget)
- **Response:** No immediate response expected by user
- **Data Flow:** Accept → Transform/Manipulate → Persist to Database
- **Access Pattern:** User accesses persisted data later via separate tool
- **Memory Constraints:** Must handle large datasets efficiently
- **Reliability:** Must ensure data integrity during processing

### Key Characteristics
- **Volume:** High (500K records)
- **Latency Tolerance:** High (async processing acceptable)
- **Memory Sensitivity:** Critical (cannot load entire dataset in memory)
- **Throughput Priority:** Moderate (batch processing acceptable)
- **Error Recovery:** Required (partial failure handling)

---

## Option Comparison: NDJSON vs Reactive Streams

### Option 7: NDJSON (Newline Delimited JSON)

#### Technical Overview
```
Client → [CSV to NDJSON] → HTTP Stream → Server → Parse → Process → Persist
```

**Architecture:**
```java
@PostMapping(value = "/import/ndjson", consumes = "application/x-ndjson")
public Mono<ImportResponse> importNdjson(@RequestBody Flux<String> lines) {
    return lines
        .map(this::parseJsonLine)
        .map(this::transformData)
        .flatMap(this::persistToDatabase)
        .then(Mono.just(new ImportResponse("accepted")));
}
```

#### Pros
- ✅ Simple text-based format
- ✅ Language-agnostic (easy client implementation)
- ✅ Line-by-line processing (memory efficient)
- ✅ Easy debugging (human-readable)
- ✅ Incremental parsing supported
- ✅ Works well with streaming frameworks

#### Cons
- ❌ Requires CSV → NDJSON conversion (client-side or server-side)
- ❌ Larger payload size vs binary formats (~30-40% overhead)
- ❌ JSON parsing overhead per line
- ❌ No built-in schema validation
- ❌ Limited tooling compared to standard JSON
- ❌ Newline character handling complexity
- ❌ Not native CSV format (requires transformation)

#### Performance Characteristics
- **Payload Size:** 500K rows × 10 columns × ~150 bytes/line = ~75MB JSON
- **Network Transfer:** ~75MB (without compression), ~15-20MB (with gzip)
- **Processing Speed:** ~10K-15K lines/second (depends on complexity)
- **Memory Footprint:** ~10-50MB (with proper streaming)

---

### Option 8: Reactive Streams (Spring WebFlux + Multipart Upload)

#### Technical Overview
```
Client → [Multipart CSV Upload] → Server → Reactive Stream → Transform → Reactive Repository → DB
```

**Architecture:**
```java
@PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Mono<ImportResponse> importCsv(@RequestPart("file") FilePart filePart) {
    return dataBufferToFlux(filePart.content())
        .transform(CsvParser::parse)
        .map(this::transformRecord)
        .buffer(1000) // Batch for DB efficiency
        .flatMap(reactiveRepository::saveAll)
        .then(createImportResponse());
}
```

#### Pros
- ✅ **Native CSV support** (no format conversion needed)
- ✅ **Backpressure handling** (automatic flow control)
- ✅ **Memory efficient** (streaming without full load)
- ✅ **Reactive database integration** (R2DBC, reactive MongoDB)
- ✅ **Built-in error handling** (retry, fallback, circuit breaker)
- ✅ **Composable operators** (map, filter, buffer, window)
- ✅ **Spring Boot ecosystem** (tight integration)
- ✅ **Production-ready** (battle-tested in high-throughput scenarios)
- ✅ **Type safety** (compile-time validation)
- ✅ **Observability** (metrics, tracing built-in)

#### Cons
- ⚠️ Steeper learning curve (reactive programming concepts)
- ⚠️ Debugging complexity (async stack traces)
- ⚠️ Requires reactive database driver (R2DBC vs JDBC)

#### Performance Characteristics
- **Payload Size:** 500K rows × 10 columns × ~100 bytes/line = ~50MB CSV
- **Network Transfer:** ~50MB (without compression), ~10-15MB (with gzip)
- **Processing Speed:** ~20K-30K lines/second (with batching)
- **Memory Footprint:** ~5-20MB (with backpressure control)
- **Database Throughput:** 10K-50K inserts/second (batch mode)

---

## Detailed Analysis for Your Use Case

### Requirement Mapping

| Requirement | NDJSON Score | Reactive Streams Score | Winner |
|-------------|--------------|------------------------|--------|
| Handle 500K rows | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| Memory efficiency | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| Async processing | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| CSV format support | ⭐⭐ (needs conversion) | ⭐⭐⭐⭐⭐ (native) | **Reactive** |
| Database persistence | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| Error handling | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| Backpressure | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |
| Implementation complexity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **NDJSON** |
| Client simplicity | ⭐⭐ (conversion needed) | ⭐⭐⭐⭐⭐ (standard multipart) | **Reactive** |
| Monitoring/Observability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Reactive** |

**Total Score:**
- NDJSON: 33/50 (66%)
- Reactive Streams: 47/50 (94%)

---

## Recommendation: Option 8 - Reactive Streams (WebFlux)

### Why Reactive Streams Wins

#### 1. **Native CSV Support**
No client-side conversion required. Standard multipart/form-data upload.
```bash
curl -X POST http://localhost:8080/api/v1/import/csv \
  -F "file=@data.csv" \
  -H "Authorization: Bearer token"
```

#### 2. **Superior Backpressure Management**
Automatically controls processing rate based on downstream capacity (database write speed).
```
CSV Stream (fast) → Backpressure → Slow DB → Auto-throttling
```

#### 3. **Memory Efficiency with Batching**
```java
.buffer(1000)  // Batch 1000 records at a time
.flatMap(batch -> repository.saveAll(batch), 3)  // 3 concurrent DB writes
```
**Memory usage:** ~5-10MB regardless of file size

#### 4. **Database Integration**
Reactive repositories provide non-blocking database operations:
```java
public interface DataRecordRepository extends ReactiveCrudRepository<DataRecord, Long> {
    Flux<DataRecord> saveAll(Iterable<DataRecord> records);
}
```

#### 5. **Error Handling & Resilience**
```java
.retry(3)  // Retry failed records
.onErrorResume(e -> logAndSkip(e))  // Skip bad records
.doOnError(e -> notifyAdmin(e))  // Alert on failures
```

#### 6. **Progress Tracking**
```java
.doOnNext(record -> updateProgress(record.getId()))
.window(10000)  // Checkpoint every 10K records
```

#### 7. **Production-Ready Patterns**
- Circuit breaker integration
- Rate limiting
- Metrics/monitoring (Micrometer)
- Distributed tracing (Sleuth)

---

## Architecture Design

### High-Level Flow

```
┌──────────────┐
│    Client    │
│  (Upload)    │
└──────┬───────┘
       │ POST /api/v1/import/csv
       │ multipart/form-data
       │
┌──────▼────────────────────────────────────────────────┐
│                  Producer Module                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  ImportController                                │ │
│  │  - Accept CSV upload                             │ │
│  │  - Validate file                                 │ │
│  │  - Create import job                             │ │
│  │  - Return 202 Accepted + Job ID                  │ │
│  └──────────────────┬───────────────────────────────┘ │
└────────────────────┼────────────────────────────────┘
                     │
                     │ Publish to Reactive Stream
                     │
┌────────────────────▼────────────────────────────────┐
│               Consumer Module                        │
│  ┌─────────────────────────────────────────────────┐│
│  │  CsvStreamProcessor                             ││
│  │  - Parse CSV lines                               ││
│  │  - Transform data                                ││
│  │  - Validate records                              ││
│  └──────────────────┬──────────────────────────────┘│
│                     │                                 │
│  ┌──────────────────▼──────────────────────────────┐│
│  │  DataPersistenceService                         ││
│  │  - Batch records (1000/batch)                   ││
│  │  - Save to DB (reactive)                        ││
│  │  - Handle errors                                ││
│  │  - Update job status                            ││
│  └──────────────────┬──────────────────────────────┘│
└────────────────────┼────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────┐
│       PostgreSQL/MongoDB           │
│  - import_jobs (status tracking)   │
│  - data_records (actual data)      │
└────────────────────────────────────┘
```

### Component Breakdown

#### Producer Module (`bulk-import-producer`)
**Responsibilities:**
- Accept CSV file upload (multipart/form-data)
- Validate file format and size
- Create import job record
- Initiate reactive stream processing
- Return immediate response (202 Accepted)

**Key Classes:**
- `ImportController` - REST endpoint
- `ImportJobService` - Job management
- `CsvValidationService` - File validation
- `ImportJobRepository` - Job persistence

#### Consumer Module (`bulk-import-consumer`)
**Responsibilities:**
- Parse CSV stream line-by-line
- Transform/manipulate data per business rules
- Batch records for efficient DB writes
- Handle errors and retries
- Update job status and progress

**Key Classes:**
- `CsvStreamProcessor` - CSV parsing + transformation
- `DataTransformationService` - Business logic
- `DataPersistenceService` - Reactive DB operations
- `DataRecordRepository` - Data persistence
- `ErrorHandler` - Error recovery

---

## Technical Implementation Details

### Data Model

```java
// Import Job (tracks async processing)
@Document(collection = "import_jobs")
public class ImportJob {
    private String id;
    private String filename;
    private Long totalRows;
    private Long processedRows;
    private Long failedRows;
    private ImportStatus status; // PENDING, PROCESSING, COMPLETED, FAILED
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String errorMessage;
}

// Data Record (actual CSV data)
@Document(collection = "data_records")
public class DataRecord {
    private String id;
    private String importJobId;
    private String column1;
    private String column2;
    // ... 10 columns total
    private LocalDateTime importedAt;
}
```

### Reactive Flow Implementation

```java
public Flux<DataRecord> processAndPersist(FilePart filePart, String jobId) {
    return filePart.content()
        // Convert DataBuffer to String lines
        .map(dataBuffer -> {
            byte[] bytes = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(bytes);
            DataBufferUtils.release(dataBuffer);
            return new String(bytes);
        })
        // Parse CSV lines
        .transform(csvParser::parseLines)
        // Transform according to business rules
        .map(csvRow -> transformToDataRecord(csvRow, jobId))
        // Validate
        .filter(this::isValid)
        // Batch for efficiency
        .buffer(1000)
        // Save to database (3 concurrent batches)
        .flatMap(batch -> dataRepository.saveAll(batch), 3)
        // Update progress
        .doOnNext(record -> updateJobProgress(jobId))
        // Error handling
        .doOnError(e -> handleError(jobId, e))
        .onErrorResume(e -> {
            log.error("Processing error for job {}", jobId, e);
            return Flux.empty();
        })
        // Backpressure strategy
        .onBackpressureBuffer(
            10000,
            BufferOverflowStrategy.DROP_OLDEST
        );
}
```

### Backpressure Strategy

```
┌─────────────────────────────────────────────────────┐
│              Backpressure Flow Control              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CSV Stream (Rate: 50K lines/sec)                  │
│         │                                           │
│         ▼                                           │
│  Buffer (10K records)  ◄───┐                       │
│         │                   │ Backpressure Signal   │
│         ▼                   │                       │
│  Transform (Rate: 30K/sec) │                       │
│         │                   │                       │
│         ▼                   │                       │
│  Batch (1000 records)       │                       │
│         │                   │                       │
│         ▼                   │                       │
│  DB Write (Rate: 10K/sec)──┘                       │
│                                                     │
│  Result: Auto-throttles to 10K/sec                 │
│  Memory: Constant ~10MB                            │
└─────────────────────────────────────────────────────┘
```

### Database Write Strategy

```java
// Batch writes for efficiency
.buffer(1000)  // 1000 records per batch
.flatMap(batch -> {
    return reactiveRepository.saveAll(batch)
        .collectList()
        .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)))
        .timeout(Duration.ofSeconds(30));
}, 3)  // Max 3 concurrent batches (3000 records in flight)
```

**Performance:**
- Batch size: 1000 records
- Concurrent batches: 3
- Throughput: ~10K-30K records/second
- Memory: ~5-10MB

---

## Monitoring & Observability

### Metrics to Track

```java
@Component
public class ImportMetrics {
    private final MeterRegistry registry;
    
    public void trackImport(String jobId, Flux<DataRecord> stream) {
        Counter successCounter = registry.counter("import.records.success", "job", jobId);
        Counter errorCounter = registry.counter("import.records.error", "job", jobId);
        Timer processingTimer = registry.timer("import.processing.time", "job", jobId);
        
        stream
            .doOnNext(r -> successCounter.increment())
            .doOnError(e -> errorCounter.increment())
            .elapsed()
            .doOnNext(tuple -> processingTimer.record(tuple.getT1(), TimeUnit.MILLISECONDS));
    }
}
```

**Key Metrics:**
- `import.jobs.created` - Total jobs created
- `import.jobs.completed` - Successfully completed jobs
- `import.jobs.failed` - Failed jobs
- `import.records.processed` - Total records processed
- `import.records.success` - Successfully persisted records
- `import.records.error` - Failed records
- `import.processing.time` - Processing duration
- `import.batch.size` - Batch sizes
- `import.throughput` - Records per second

---

## Error Handling Strategy

### Error Categories

#### 1. **Validation Errors** (Skip record)
```java
.filter(record -> {
    if (!isValid(record)) {
        logValidationError(record);
        errorCounter.increment();
        return false;
    }
    return true;
})
```

#### 2. **Transient Database Errors** (Retry)
```java
.retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
    .filter(e -> e instanceof TransientDataAccessException))
```

#### 3. **Fatal Errors** (Stop processing)
```java
.doOnError(FatalException.class, e -> {
    updateJobStatus(jobId, ImportStatus.FAILED);
    notifyAdministrator(jobId, e);
})
```

### Error Record Storage

```java
@Document(collection = "import_errors")
public class ImportError {
    private String id;
    private String jobId;
    private Integer lineNumber;
    private String rawLine;
    private String errorMessage;
    private LocalDateTime occurredAt;
}
```

---

## Performance Benchmarks

### Expected Performance (500K Rows)

| Metric | Conservative | Optimistic |
|--------|--------------|------------|
| **Upload Time** | 5-10 sec | 2-5 sec |
| **Processing Time** | 30-60 sec | 15-30 sec |
| **Total Time** | 35-70 sec | 17-35 sec |
| **Memory Usage** | 50-100 MB | 20-50 MB |
| **CPU Usage** | 40-60% | 30-50% |
| **DB Connections** | 3-5 | 3 |

### Scalability

| File Size | Rows | Expected Time | Memory |
|-----------|------|---------------|--------|
| 10 MB | 100K | 7-15 sec | 10-20 MB |
| 50 MB | 500K | 35-70 sec | 20-50 MB |
| 100 MB | 1M | 70-140 sec | 30-80 MB |
| 500 MB | 5M | 6-12 min | 50-150 MB |

---

## Implementation Checklist

### Phase 1: Core Implementation
- [ ] Create `bulk-import-producer` module
- [ ] Create `bulk-import-consumer` module
- [ ] Implement `ImportController` endpoint
- [ ] Implement CSV parsing with reactive streams
- [ ] Implement data transformation logic
- [ ] Implement reactive repository layer
- [ ] Add error handling and retry logic

### Phase 2: Resilience & Monitoring
- [ ] Add circuit breaker pattern
- [ ] Implement backpressure handling
- [ ] Add Micrometer metrics
- [ ] Add distributed tracing
- [ ] Implement health checks
- [ ] Add rate limiting

### Phase 3: Testing
- [ ] Unit tests (service layer)
- [ ] Integration tests (end-to-end)
- [ ] Load tests (500K+ rows)
- [ ] Performance benchmarks
- [ ] Error scenario tests

### Phase 4: Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagrams
- [ ] Runbook for operations
- [ ] Performance tuning guide

---

## Security Considerations

### File Upload Security

```java
@Component
public class FileUploadValidator {
    private static final long MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "text/csv",
        "text/plain",
        "application/csv"
    );
    
    public void validate(FilePart filePart) {
        // Size check
        if (filePart.headers().getContentLength() > MAX_FILE_SIZE) {
            throw new FileSizeLimitExceededException("File too large");
        }
        
        // Content type check
        String contentType = filePart.headers().getContentType().toString();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidFileTypeException("Invalid file type");
        }
        
        // Filename sanitization
        String filename = sanitizeFilename(filePart.filename());
    }
}
```

### Rate Limiting

```java
@Component
public class ImportRateLimiter {
    private final RateLimiter rateLimiter = RateLimiter.create(10.0); // 10 imports/sec
    
    public boolean allowImport() {
        return rateLimiter.tryAcquire(Duration.ofSeconds(5));
    }
}
```

### Authentication & Authorization

```java
@PreAuthorize("hasRole('BULK_IMPORT_USER')")
@PostMapping("/import/csv")
public Mono<ImportResponse> importCsv(...) {
    // Endpoint secured
}
```

---

## Decision Summary

### Final Recommendation: **Reactive Streams (Option 8)**

**Rationale:**
1. ✅ **Native CSV support** - No format conversion overhead
2. ✅ **Superior backpressure** - Automatic flow control
3. ✅ **Memory efficiency** - Constant memory usage regardless of file size
4. ✅ **Database integration** - Reactive repositories for non-blocking I/O
5. ✅ **Production-ready** - Battle-tested in enterprise scenarios
6. ✅ **Spring Boot ecosystem** - Tight integration, extensive tooling
7. ✅ **Observability** - Built-in metrics, tracing, monitoring
8. ✅ **Error resilience** - Retry, fallback, circuit breaker patterns

**Trade-offs:**
- ⚠️ Learning curve for reactive programming
- ⚠️ Requires reactive database driver (R2DBC)
- ⚠️ More complex debugging

**Mitigation:**
- Comprehensive unit and integration tests
- Extensive logging and metrics
- Team training on reactive patterns
- Clear documentation and examples

---

## Next Steps

1. **Implement producer module** - Accept CSV upload, create job
2. **Implement consumer module** - Process and persist data
3. **Add monitoring** - Metrics, logs, tracing
4. **Load testing** - Validate performance with 500K+ rows
5. **Documentation** - API docs, architecture diagrams
6. **Deploy to staging** - Validate in real environment

---

**Decision Approved By:** Principal Engineer  
**Implementation Owner:** Backend Team  
**Target Completion:** Q2 2026  
**Review Date:** Post-implementation (after load testing)

---

## References

- [Reactive Streams Specification](https://www.reactive-streams.org/)
- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html)
- [Project Reactor Reference](https://projectreactor.io/docs/core/release/reference/)
- [R2DBC Specification](https://r2dbc.io/spec/0.9.1.RELEASE/spec/html/)
- [Spring Data R2DBC](https://spring.io/projects/spring-data-r2dbc)

---

**Document Version:** 1.0  
**Last Updated:** March 22, 2026  
**Classification:** Internal - Technical Decision Record

