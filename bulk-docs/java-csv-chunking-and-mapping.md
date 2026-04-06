# Large CSV Processing with Chunking and Property Mapping (Java Implementation Guide)

**Target Audience:** Java developers implementing CSV import features  
**Last Updated:** April 2026

## Problem Statement

When processing large CSV files (100MB+, millions of rows), loading the entire file into memory causes:
- **OutOfMemoryError** exceptions
- **Poor performance** due to GC pressure
- **Failed uploads** with no resumability
- **Blocked threads** during processing

## Solution: Streaming + Chunking + Mapping

Break the CSV into **fixed-size chunks** (e.g., 1,000 rows), process each chunk independently, and transform source CSV columns to target domain objects.

### Key Benefits

✅ **Constant memory footprint** (only one chunk in memory at a time)  
✅ **Horizontal scalability** (chunks can be processed in parallel)  
✅ **Partial success handling** (process chunk 1-50, fail on 51, resume from 52)  
✅ **Property transformation isolation** (source schema ≠ target schema)

---

## Architecture Overview

```
┌─────────────────────┐
│   Large CSV File    │
│   (50M rows)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   CSV Reader        │
│   (Apache Commons   │
│    CSV / OpenCSV)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Chunker           │
│   (Buffer 1000 rows)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Property Mapper   │
│   (SourceRow ->     │
│    TargetObject)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Validator         │
│   (JSR-303 Bean     │
│    Validation)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Batch Writer      │
│   (JDBC Batch /     │
│    JPA Persist)     │
└─────────────────────┘
```

---

## Implementation Patterns

### 1. Streaming CSV Reader (No Full File Load)

**Bad (loads entire file):**
```java
// ❌ DON'T: Loads all rows into memory
List<String[]> allRows = CSVReader.readAll(inputStream);
```

**Good (streams rows):**
```java
// ✅ DO: Stream rows one at a time
try (Reader reader = new BufferedReader(new InputStreamReader(inputStream));
     CSVReader csvReader = new CSVReader(reader)) {
    
    String[] nextRow;
    while ((nextRow = csvReader.readNext()) != null) {
        // Process one row at a time
    }
}
```

---

### 2. Chunking Strategy

#### Pattern: Fixed-Size Buffer

```java
public class CsvChunker<T> {
    private final int chunkSize;
    
    public CsvChunker(int chunkSize) {
        this.chunkSize = chunkSize;
    }
    
    public Stream<List<T>> chunk(Iterator<T> iterator) {
        return StreamSupport.stream(
            new ChunkingSpliterator<>(iterator, chunkSize),
            false
        );
    }
}

// Usage
csvChunker.chunk(csvRowIterator)
    .forEach(chunk -> processChunk(chunk)); // chunk = 1000 rows
```

#### Pattern: Time-Based Chunking (for long-running imports)

```java
public class TimeBasedChunker<T> {
    private final Duration maxChunkDuration;
    
    public List<T> collectChunk(Iterator<T> iterator) {
        List<T> chunk = new ArrayList<>();
        Instant start = Instant.now();
        
        while (iterator.hasNext() && 
               Duration.between(start, Instant.now()).compareTo(maxChunkDuration) < 0) {
            chunk.add(iterator.next());
        }
        return chunk;
    }
}
```

---

### 3. Property Mapping (Source → Target)

#### Example: CSV Row → Domain Object

**Source CSV:**
```csv
user_id,first_name,last_name,email_address,registration_date
1001,John,Doe,john.doe@example.com,2025-01-15
```

**Target Domain Object:**
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    private Long id;
    
    private String fullName;  // mapped from first_name + last_name
    private String email;     // mapped from email_address
    private LocalDate registeredAt; // mapped from registration_date
}
```

#### Mapper Interface

```java
public interface RowMapper<S, T> {
    T map(S source) throws MappingException;
}
```

#### Mapper Implementation

```java
@Component
public class CsvRowToUserMapper implements RowMapper<CSVRecord, User> {
    
    @Override
    public User map(CSVRecord csvRecord) throws MappingException {
        try {
            User user = new User();
            
            // Direct mapping
            user.setId(Long.parseLong(csvRecord.get("user_id")));
            user.setEmail(csvRecord.get("email_address"));
            
            // Composite mapping (first_name + last_name → fullName)
            String fullName = csvRecord.get("first_name") + " " + 
                              csvRecord.get("last_name");
            user.setFullName(fullName);
            
            // Type transformation (String → LocalDate)
            LocalDate registeredAt = LocalDate.parse(
                csvRecord.get("registration_date")
            );
            user.setRegisteredAt(registeredAt);
            
            return user;
            
        } catch (Exception e) {
            throw new MappingException(
                "Failed to map CSV row at line " + csvRecord.getRecordNumber(),
                e
            );
        }
    }
}
```

---

### 4. Complete Processing Pipeline

```java
@Service
public class LargeCsvImportService {
    
    private static final int CHUNK_SIZE = 1000;
    
    private final CsvRowToUserMapper mapper;
    private final UserRepository userRepository;
    private final Validator validator;
    
    public ImportResult importCsv(InputStream inputStream) throws IOException {
        
        ImportResult result = new ImportResult();
        
        try (Reader reader = new BufferedReader(new InputStreamReader(inputStream));
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.withHeader())) {
            
            List<User> chunk = new ArrayList<>(CHUNK_SIZE);
            int rowNumber = 0;
            
            for (CSVRecord csvRecord : parser) {
                rowNumber++;
                
                try {
                    // 1. Map CSV row to domain object
                    User user = mapper.map(csvRecord);
                    
                    // 2. Validate
                    Set<ConstraintViolation<User>> violations = validator.validate(user);
                    if (!violations.isEmpty()) {
                        result.addError(rowNumber, "Validation failed: " + violations);
                        continue;
                    }
                    
                    // 3. Add to chunk buffer
                    chunk.add(user);
                    
                    // 4. Flush chunk when full
                    if (chunk.size() >= CHUNK_SIZE) {
                        flushChunk(chunk);
                        result.addProcessedRows(chunk.size());
                        chunk.clear();
                    }
                    
                } catch (MappingException e) {
                    result.addError(rowNumber, e.getMessage());
                }
            }
            
            // 5. Flush remaining rows
            if (!chunk.isEmpty()) {
                flushChunk(chunk);
                result.addProcessedRows(chunk.size());
            }
        }
        
        return result;
    }
    
    @Transactional
    private void flushChunk(List<User> chunk) {
        // Batch insert for performance
        userRepository.saveAll(chunk);
    }
}
```

---

## Advanced Patterns

### Pattern: Configurable Mapping with Strategy Pattern

```java
public interface PropertyMappingStrategy {
    String map(String sourceValue);
}

public class UpperCaseStrategy implements PropertyMappingStrategy {
    public String map(String sourceValue) {
        return sourceValue.toUpperCase();
    }
}

public class ConfigurableMapper {
    private final Map<String, PropertyMappingStrategy> strategies;
    
    public ConfigurableMapper(Map<String, PropertyMappingStrategy> strategies) {
        this.strategies = strategies;
    }
    
    public String mapProperty(String propertyName, String value) {
        PropertyMappingStrategy strategy = strategies.get(propertyName);
        return strategy != null ? strategy.map(value) : value;
    }
}
```

### Pattern: Error Accumulation with Resume Support

```java
@Entity
public class ImportJob {
    @Id
    private UUID id;
    
    private String filename;
    private ImportStatus status; // PENDING, PROCESSING, COMPLETED, FAILED
    private long lastProcessedRow;
    private long totalRows;
    private int failedRows;
    
    @ElementCollection
    private List<String> errors;
}

// Resume from last successful chunk
public void resumeImport(UUID jobId, InputStream inputStream) {
    ImportJob job = importJobRepository.findById(jobId);
    long skipRows = job.getLastProcessedRow();
    
    // Skip already-processed rows
    try (CSVParser parser = createParser(inputStream)) {
        parser.stream()
            .skip(skipRows)
            .forEach(record -> processRecord(record, job));
    }
}
```

---

## Performance Tuning

### 1. Optimal Chunk Size

| File Size | Chunk Size | Rationale |
|-----------|-----------|-----------|
| < 10MB    | 500 rows  | Small overhead, fast completion |
| 10-100MB  | 1,000 rows | Balance memory and throughput |
| 100MB-1GB | 5,000 rows | Reduce I/O overhead |
| > 1GB     | 10,000 rows | Maximize throughput |

### 2. JDBC Batch Insert Configuration

```java
@Configuration
public class JpaConfig {
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        
        Properties properties = new Properties();
        properties.setProperty("hibernate.jdbc.batch_size", "1000");
        properties.setProperty("hibernate.order_inserts", "true");
        properties.setProperty("hibernate.order_updates", "true");
        properties.setProperty("hibernate.jdbc.batch_versioned_data", "true");
        
        em.setJpaProperties(properties);
        return em;
    }
}
```

### 3. Parallel Chunk Processing

```java
public void processInParallel(InputStream inputStream) {
    List<List<CSVRecord>> chunks = partitionCsvIntoChunks(inputStream);
    
    ExecutorService executor = Executors.newFixedThreadPool(4);
    
    chunks.forEach(chunk -> {
        executor.submit(() -> processChunk(chunk));
    });
    
    executor.shutdown();
    executor.awaitTermination(1, TimeUnit.HOURS);
}
```

---

## Testing Strategy

### Unit Test: Mapper

```java
@Test
void shouldMapCsvRecordToUser() {
    // Given
    CSVRecord record = mockCsvRecord(
        "user_id", "1001",
        "first_name", "John",
        "last_name", "Doe",
        "email_address", "john@example.com",
        "registration_date", "2025-01-15"
    );
    
    // When
    User user = mapper.map(record);
    
    // Then
    assertThat(user.getId()).isEqualTo(1001L);
    assertThat(user.getFullName()).isEqualTo("John Doe");
    assertThat(user.getEmail()).isEqualTo("john@example.com");
    assertThat(user.getRegisteredAt()).isEqualTo(LocalDate.of(2025, 1, 15));
}
```

### Integration Test: End-to-End Import

```java
@SpringBootTest
@Transactional
class LargeCsvImportServiceTest {
    
    @Autowired
    private LargeCsvImportService importService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldImportLargeCsvInChunks() throws IOException {
        // Given: CSV with 5,000 rows
        InputStream csvStream = generateTestCsv(5000);
        
        // When
        ImportResult result = importService.importCsv(csvStream);
        
        // Then
        assertThat(result.getProcessedRows()).isEqualTo(5000);
        assertThat(result.getFailedRows()).isZero();
        assertThat(userRepository.count()).isEqualTo(5000);
    }
}
```

---

## Common Pitfalls and Solutions

| Pitfall | Solution |
|---------|----------|
| **Loading entire CSV into memory** | Use streaming APIs (CSVParser, BufferedReader) |
| **No transaction boundaries** | Flush chunks in separate transactions |
| **Ignoring failed rows** | Accumulate errors, log to DLQ |
| **Blocking upload thread** | Process asynchronously with queue |
| **No progress tracking** | Persist `ImportJob` entity with row counter |
| **Hardcoded column mapping** | Use annotation-based or config-driven mappers |

---

## Recommended Libraries

| Library | Use Case | Maven Coordinate |
|---------|----------|------------------|
| **Apache Commons CSV** | CSV parsing, streaming | `org.apache.commons:commons-csv:1.10.0` |
| **OpenCSV** | Alternative CSV parser | `com.opencsv:opencsv:5.9` |
| **MapStruct** | Property mapping (compile-time) | `org.mapstruct:mapstruct:1.5.5.Final` |
| **Bean Validation** | JSR-303 validation | `jakarta.validation:jakarta.validation-api:3.0.2` |
| **Spring Batch** | Enterprise batch framework | `org.springframework.boot:spring-boot-starter-batch` |

---

## Decision Matrix: When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| **Small CSV (< 10MB)** | Simple in-memory load |
| **Medium CSV (10-100MB)** | Chunking with single-threaded processing |
| **Large CSV (100MB-1GB)** | Chunking + async processing + progress tracking |
| **Huge CSV (> 1GB)** | Stream to object storage → batch processing framework (Spring Batch / Apache Spark) |

---

## Integration with Overall Architecture

This implementation guide complements the [Huge CSV Import Architecture](./arc.md) document:

- **Frontend → Object Storage**: Browser uploads CSV using multipart/resumable uploads
- **Object Storage → Queue**: Upload completion triggers processing event
- **Queue → Worker**: This Java service acts as the "Parsing + Validation Worker"
- **Worker → Staging**: Chunks written to staging tables via batch inserts
- **Staging → DB**: Bulk loader uses native `COPY` commands for final load

### Where This Code Fits

```
┌──────────────────────────────────────────────────────┐
│                 PARSING WORKER                       │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  LargeCsvImportService                     │    │
│  │  - Streams CSV from Object Storage         │    │
│  │  - Chunks into 1,000-row batches          │    │
│  │  - Maps CSV → Domain Objects               │    │
│  │  - Validates with Bean Validation          │    │
│  │  - Batch inserts to Staging Tables         │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Summary

1. **Stream, don't load**: Use `CSVParser` or `BufferedReader`, never `readAll()`
2. **Chunk, don't bulk**: Process 1,000-10,000 rows at a time
3. **Map explicitly**: Create dedicated mapper classes for source → target transformation
4. **Validate early**: Fail fast on invalid rows, accumulate errors
5. **Batch writes**: Use JDBC batch inserts or JPA `saveAll()` with proper Hibernate config
6. **Track progress**: Persist import job state for resumability

---

## Next Steps for Your Team

1. ✅ Choose your CSV library (Apache Commons CSV recommended)
2. ✅ Define source CSV schema and target domain objects
3. ✅ Implement `RowMapper<CSVRecord, YourEntity>`
4. ✅ Configure chunk size based on file size expectations
5. ✅ Add integration tests with synthetic large CSV files
6. ✅ Monitor heap usage and adjust chunk size accordingly
7. ✅ Integrate with workflow orchestrator from [arc.md](./arc.md)

**Questions?** Review the [Huge CSV Import Architecture](./arc.md) for end-to-end system design and cloud component recommendations.

