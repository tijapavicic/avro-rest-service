# HTTP Streaming Options for Large Data Transfer - Technical Guide

**Author:** Tijana 
**Date:** March 22, 2026  
**Context:** Spring Boot Avro REST Service - Large Payload Transfer

---

## Executive Summary

This document provides a comprehensive analysis of HTTP streaming techniques for transferring large datasets over HTTP, including technical implementation details, appropriate HTTP status codes, trade-offs, and recommendations for the Spring Boot ecosystem.

---

## Table of Contents

1. [HTTP Streaming Techniques](#http-streaming-techniques)
2. [HTTP Status Codes for Streaming](#http-status-codes-for-streaming)
3. [Spring Boot Implementation Patterns](#spring-boot-implementation-patterns)
4. [Recommendations & Best Practices](#recommendations--best-practices)
5. [Decision Matrix](#decision-matrix)

---

## HTTP Streaming Techniques

### 1. Chunked Transfer Encoding (HTTP/1.1)

**Description:**  
HTTP/1.1 standard mechanism that sends data in chunks without knowing the total content length upfront. The server sends data as it becomes available, terminated by a zero-length chunk.

**Technical Details:**
```
Transfer-Encoding: chunked

5\r\n
Hello\r\n
6\r\n
 World\r\n
0\r\n
\r\n
```

**Use Cases:**
- Real-time data generation (reports, logs, analytics)
- Database result streaming
- File processing pipelines
- Unknown content length scenarios

**Pros:**
- Built into HTTP/1.1 standard
- No special client requirements
- Memory-efficient server-side
- Progressive rendering possible
- Works with existing proxies/CDNs

**Cons:**
- Cannot determine progress (no Content-Length)
- Cannot seek/resume
- Requires persistent connection
- Buffering by intermediaries possible

**Spring Boot Implementation:**
```java
@GetMapping(value = "/stream/chunked", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
public StreamingResponseBody streamChunked() {
    return outputStream -> {
        for (int i = 0; i < 1000; i++) {
            byte[] data = generateChunk(i);
            outputStream.write(data);
            outputStream.flush(); // Force chunk send
        }
    };
}
```

**HTTP Status Codes:**
- `200 OK` - Streaming started successfully
- `500 Internal Server Error` - Error during stream (connection drops)

---

### 2. Server-Sent Events (SSE)

**Description:**  
Unidirectional server-to-client streaming protocol over HTTP. Client opens connection, server pushes events as they occur. Text-based protocol with automatic reconnection.

**Technical Details:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"message": "First event"}\n\n
data: {"message": "Second event"}\n\n
```

**Use Cases:**
- Real-time notifications
- Live dashboards/metrics
- Progress updates for long-running jobs
- Activity feeds
- Stock tickers

**Pros:**
- Automatic reconnection with `Last-Event-ID`
- Built-in browser support (EventSource API)
- Simple text-based protocol
- Works through firewalls (HTTP)
- Named event types
- UTF-8 encoded

**Cons:**
- Text-only (base64 for binary)
- Unidirectional (server → client)
- Limited to 6 concurrent connections (browser)
- No request headers after initial connection
- HTTP/1.1 connection overhead

**Spring Boot Implementation:**
```java
@GetMapping(value = "/stream/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<DataChunk>> streamSse() {
    return Flux.interval(Duration.ofSeconds(1))
        .map(sequence -> ServerSentEvent.<DataChunk>builder()
            .id(String.valueOf(sequence))
            .event("data-update")
            .data(generateData(sequence))
            .retry(Duration.ofSeconds(5))
            .build())
        .take(100);
}
```

**HTTP Status Codes:**
- `200 OK` - SSE stream established
- `204 No Content` - No events to send (close connection)
- `503 Service Unavailable` - Temporary unavailability (client should retry)

---

### 3. WebSockets

**Description:**  
Full-duplex bidirectional communication protocol. Upgrades HTTP connection to persistent WebSocket connection. Binary and text frames supported.

**Technical Details:**
```
GET /socket HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=
```

**Use Cases:**
- Real-time bidirectional communication
- Chat applications
- Collaborative editing
- Gaming
- Trading platforms
- IoT device communication

**Pros:**
- Full-duplex bidirectional
- Low latency overhead (no HTTP headers per message)
- Binary and text support
- Multiplexing possible
- Efficient for high-frequency updates

**Cons:**
- More complex than HTTP
- Proxy/firewall traversal issues
- No automatic reconnection
- Requires connection management
- Not RESTful
- Harder to cache/load-balance

**Spring Boot Implementation:**
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(dataStreamHandler(), "/ws/stream")
            .setAllowedOrigins("*");
    }
}

public class DataStreamHandler extends TextWebSocketHandler {
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Handle incoming messages
    }
    
    public void streamData(WebSocketSession session) {
        session.sendMessage(new BinaryMessage(data));
    }
}
```

**HTTP Status Codes:**
- `101 Switching Protocols` - Upgrade successful
- `400 Bad Request` - Invalid upgrade request
- `426 Upgrade Required` - Client must upgrade
- `403 Forbidden` - Origin not allowed

---

### 4. HTTP/2 Server Push

**Description:**  
HTTP/2 feature allowing server to proactively send resources to client cache before they're requested. Multiplexed streams over single connection.

**Technical Details:**
```
PUSH_PROMISE frame for /resource
DATA frame with resource content
```

**Use Cases:**
- Preloading critical resources
- Optimizing page load times
- Pushing related data with query response
- Asset preloading

**Pros:**
- Reduces round trips
- Multiplexed streams
- Header compression (HPACK)
- Single TCP connection
- Binary protocol efficiency

**Cons:**
- Client cannot reject easily (wastes bandwidth)
- Cache invalidation complexity
- Limited browser support for programmatic use
- Requires HTTP/2 infrastructure
- Not suitable for large streaming datasets

**Spring Boot Implementation:**
```java
@GetMapping("/data")
public ResponseEntity<DataResponse> getData(PushBuilder pushBuilder) {
    if (pushBuilder != null) {
        pushBuilder.path("/related-data").push();
    }
    return ResponseEntity.ok(data);
}
```

**HTTP Status Codes:**
- `200 OK` - Main response
- `200 OK` - Pushed resources
- `RST_STREAM` - Stream cancelled

---

### 5. Multipart Responses

**Description:**  
Single HTTP response containing multiple parts with different content types, boundaries, and headers. Each part can be processed independently.

**Technical Details:**
```
Content-Type: multipart/mixed; boundary=--boundary123

--boundary123
Content-Type: application/json

{"id": 1, "data": "..."}
--boundary123
Content-Type: application/json

{"id": 2, "data": "..."}
--boundary123--
```

**Use Cases:**
- Batch processing results
- Mixed content types (JSON + binary)
- Email with attachments
- Form data with files

**Pros:**
- Single request/response
- Different content types per part
- Standard HTTP response
- Can include metadata per part

**Cons:**
- Must generate all parts before responding (not true streaming)
- Complex parsing
- Limited client library support
- Size limitations

**Spring Boot Implementation:**
```java
@GetMapping("/batch")
public ResponseEntity<MultipartFile> getBatchData() {
    MultipartBodyBuilder builder = new MultipartBodyBuilder();
    builder.part("part1", data1).contentType(MediaType.APPLICATION_JSON);
    builder.part("part2", data2).contentType(MediaType.APPLICATION_OCTET_STREAM);
    
    return ResponseEntity.ok()
        .contentType(MediaType.MULTIPART_MIXED)
        .body(builder.build());
}
```

**HTTP Status Codes:**
- `200 OK` - Successful multipart response
- `413 Payload Too Large` - Parts too large

---

### 6. HTTP Range Requests (Partial Content)

**Description:**  
Client requests specific byte ranges of a resource. Server responds with partial content. Enables resumable downloads and parallel chunk fetching.

**Technical Details:**
```
Request:
Range: bytes=0-1023

Response:
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/5000
Content-Length: 1024
```

**Use Cases:**
- Resumable downloads
- Video streaming (seeking)
- Parallel downloads
- Large file distribution
- CDN optimization

**Pros:**
- Resume interrupted transfers
- Parallel chunk downloads
- Seek in media files
- Bandwidth optimization
- Standard HTTP feature

**Cons:**
- Requires client implementation
- Server must support ranges
- Not suitable for dynamic content
- Multiple requests overhead

**Spring Boot Implementation:**
```java
@GetMapping("/file/{id}")
public ResponseEntity<Resource> getFile(
    @PathVariable String id,
    @RequestHeader(value = "Range", required = false) String range) {
    
    Resource resource = loadResource(id);
    long contentLength = resource.contentLength();
    
    if (range != null) {
        // Parse range: bytes=start-end
        long start = parseStart(range);
        long end = parseEnd(range, contentLength);
        
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
            .header("Content-Range", String.format("bytes %d-%d/%d", start, end, contentLength))
            .header("Accept-Ranges", "bytes")
            .contentLength(end - start + 1)
            .body(new RangeResource(resource, start, end));
    }
    
    return ResponseEntity.ok()
        .header("Accept-Ranges", "bytes")
        .contentLength(contentLength)
        .body(resource);
}
```

**HTTP Status Codes:**
- `206 Partial Content` - Range request successful
- `200 OK` - Full content (when range not specified)
- `416 Range Not Satisfiable` - Invalid range
- `412 Precondition Failed` - ETag/If-Range mismatch

---

### 7. NDJSON (Newline Delimited JSON)

**Description:**  
Streaming JSON format where each line is a complete, independent JSON object. Enables incremental parsing without loading entire response.

**Technical Details:**
```
Content-Type: application/x-ndjson

{"id": 1, "value": "first"}\n
{"id": 2, "value": "second"}\n
{"id": 3, "value": "third"}\n
```

**Use Cases:**
- Log streaming
- Database query results
- Bulk data export/import
- ETL pipelines
- Analytics data streams

**Pros:**
- Incremental parsing
- Memory efficient
- Simple format
- Language-agnostic
- Easy to generate/consume
- Works with chunked encoding

**Cons:**
- Not standard JSON
- No array wrapper
- Limited tooling
- Newline handling required

**Spring Boot Implementation:**
```java
@GetMapping(value = "/stream/ndjson", produces = "application/x-ndjson")
public Flux<String> streamNdjson() {
    return Flux.fromStream(dataRepository.streamAll())
        .map(entity -> objectMapper.writeValueAsString(entity) + "\n")
        .onErrorResume(e -> Flux.empty());
}
```

**HTTP Status Codes:**
- `200 OK` - Stream started successfully
- `500 Internal Server Error` - Stream error

---

### 8. Reactive Streams (Spring WebFlux / Reactor)

**Description:**  
Asynchronous, non-blocking streaming with backpressure support. Publisher emits items, subscriber consumes at its own pace. Built on Reactive Streams specification.

**Technical Details:**
```java
Flux<DataChunk> - 0..N items
Mono<DataChunk> - 0..1 item
```

**Use Cases:**
- High-throughput data pipelines
- Backpressure-sensitive systems
- Reactive microservices
- Event-driven architectures
- Real-time processing

**Pros:**
- Backpressure handling
- Composable operators
- Resource efficient
- Non-blocking I/O
- Integration with reactive databases
- Spring ecosystem support

**Cons:**
- Learning curve
- Debugging complexity
- Not suitable for all use cases
- Requires reactive stack

**Spring Boot Implementation:**
```java
@GetMapping(value = "/stream/reactive", produces = MediaType.APPLICATION_STREAM_JSON_VALUE)
public Flux<DataChunk> streamReactive() {
    return dataService.streamData()
        .delayElements(Duration.ofMillis(100))
        .onBackpressureBuffer(1000)
        .doOnNext(chunk -> log.debug("Emitting chunk: {}", chunk.getId()))
        .onErrorResume(e -> {
            log.error("Stream error", e);
            return Flux.empty();
        });
}
```

**HTTP Status Codes:**
- `200 OK` - Stream established
- `503 Service Unavailable` - Backpressure overflow
- `500 Internal Server Error` - Stream error

---

### 9. gRPC Streaming

**Description:**  
High-performance RPC framework using HTTP/2 with Protocol Buffers. Supports unary, server-streaming, client-streaming, and bidirectional streaming.

**Technical Details:**
```protobuf
service DataService {
    rpc StreamData(DataRequest) returns (stream DataChunk);
    rpc UploadData(stream DataChunk) returns (UploadResponse);
    rpc BidirectionalStream(stream DataChunk) returns (stream DataChunk);
}
```

**Use Cases:**
- Microservice communication
- High-throughput data transfer
- Bidirectional streaming
- Polyglot systems
- Low-latency requirements

**Pros:**
- HTTP/2 multiplexing
- Binary protocol (efficient)
- Strong typing (protobuf)
- Bidirectional streaming
- Built-in load balancing
- Code generation

**Cons:**
- Not browser-native (needs gRPC-Web)
- Learning curve
- Binary debugging difficulty
- Requires code generation
- Limited REST interoperability

**Spring Boot Implementation:**
```java
@GrpcService
public class DataStreamService extends DataServiceGrpc.DataServiceImplBase {
    @Override
    public void streamData(DataRequest request, StreamObserver<DataChunk> responseObserver) {
        dataRepository.streamAll().forEach(chunk -> {
            responseObserver.onNext(chunk);
        });
        responseObserver.onCompleted();
    }
}
```

**gRPC Status Codes:**
- `OK` (0) - Success
- `CANCELLED` (1) - Client cancelled
- `UNKNOWN` (2) - Unknown error
- `RESOURCE_EXHAUSTED` (8) - Rate limit/quota
- `UNAVAILABLE` (14) - Service unavailable

---

### 10. GraphQL Subscriptions

**Description:**  
GraphQL feature for real-time updates. Client subscribes to events, server pushes updates when data changes. Typically over WebSocket.

**Technical Details:**
```graphql
subscription OnDataUpdate {
    dataUpdated {
        id
        value
        timestamp
    }
}
```

**Use Cases:**
- Real-time GraphQL applications
- Unified API with queries/mutations/subscriptions
- Notification systems
- Live data synchronization

**Pros:**
- Type-safe
- Client specifies needed fields
- Integrates with GraphQL ecosystem
- Schema-driven

**Cons:**
- Requires WebSocket (usually)
- GraphQL complexity
- Limited to GraphQL stack
- Overhead for simple streaming

**Spring Boot Implementation:**
```java
@Component
public class DataSubscription {
    @SubscriptionMapping
    public Flux<DataUpdate> dataUpdates() {
        return dataService.getUpdateStream()
            .map(this::toDataUpdate);
    }
}
```

**HTTP/WebSocket Status Codes:**
- `101 Switching Protocols` - WebSocket upgrade
- GraphQL errors in response payload

---

## HTTP Status Codes for Streaming

### Success Codes

#### 200 OK
- **Usage:** Standard successful response for streaming endpoints
- **When to use:**
  - Chunked transfer encoding started
  - SSE stream established
  - NDJSON stream initiated
  - WebFlux Flux/Mono emission
- **Example:**
  ```
  HTTP/1.1 200 OK
  Content-Type: application/x-ndjson
  Transfer-Encoding: chunked
  ```

#### 206 Partial Content
- **Usage:** Range request successful
- **When to use:**
  - Client requested specific byte range
  - Resumable download
  - Video/audio seeking
- **Required Headers:**
  - `Content-Range: bytes start-end/total`
  - `Content-Length: range-length`
- **Example:**
  ```
  HTTP/1.1 206 Partial Content
  Content-Range: bytes 1000-1999/5000
  Content-Length: 1000
  ```

#### 101 Switching Protocols
- **Usage:** Protocol upgrade (WebSocket)
- **When to use:**
  - WebSocket handshake successful
  - HTTP/2 upgrade
- **Example:**
  ```
  HTTP/1.1 101 Switching Protocols
  Upgrade: websocket
  Connection: Upgrade
  ```

#### 202 Accepted
- **Usage:** Request accepted for async processing
- **When to use:**
  - Long-running job initiated
  - Processing started, result available later
  - Polling-based pattern
- **Example:**
  ```
  HTTP/1.1 202 Accepted
  Location: /jobs/12345
  ```

---

### Client Error Codes

#### 400 Bad Request
- **Usage:** Invalid request format
- **When to use:**
  - Malformed WebSocket upgrade
  - Invalid streaming parameters
  - Bad request body
- **Example:**
  ```json
  {
    "error": "Invalid streaming format",
    "details": "Content-Type must be application/x-ndjson"
  }
  ```

#### 408 Request Timeout
- **Usage:** Client didn't send data in time
- **When to use:**
  - Client-to-server upload timeout
  - Idle connection timeout
  - No data received within timeout window

#### 413 Payload Too Large
- **Usage:** Request entity exceeds limits
- **When to use:**
  - Upload size exceeds max allowed
  - Stream chunk size too large
  - Batch size limit exceeded
- **Headers:**
  - `Retry-After: 3600` (if temporary)
- **Example:**
  ```json
  {
    "error": "Payload too large",
    "maxSize": "100MB",
    "received": "150MB"
  }
  ```

#### 416 Range Not Satisfiable
- **Usage:** Invalid range in Range request
- **When to use:**
  - Range beyond file size
  - Invalid range format
  - Overlapping ranges
- **Required Header:**
  - `Content-Range: bytes */total-size`
- **Example:**
  ```
  HTTP/1.1 416 Range Not Satisfiable
  Content-Range: bytes */5000
  ```

#### 426 Upgrade Required
- **Usage:** Client must upgrade protocol
- **When to use:**
  - WebSocket required but not requested
  - HTTP/2 required
- **Required Header:**
  - `Upgrade: websocket`

---

### Server Error Codes

#### 500 Internal Server Error
- **Usage:** Unexpected server error during streaming
- **When to use:**
  - Stream generation failure
  - Unhandled exception
  - Data corruption
- **Note:** Connection typically closes after this

#### 502 Bad Gateway
- **Usage:** Upstream service failure
- **When to use:**
  - Downstream service unavailable during stream
  - Proxy cannot establish connection
  - Gateway timeout

#### 503 Service Unavailable
- **Usage:** Temporary unavailability
- **When to use:**
  - System overloaded
  - Rate limit exceeded (server-side)
  - Backpressure overflow
  - Maintenance mode
- **Required Header:**
  - `Retry-After: 120` (seconds or HTTP date)
- **Example:**
  ```json
  {
    "error": "Service temporarily unavailable",
    "reason": "Rate limit exceeded",
    "retryAfter": 60
  }
  ```

#### 429 Too Many Requests
- **Usage:** Rate limiting
- **When to use:**
  - Client exceeded rate limit
  - Too many concurrent streams
  - Quota exceeded
- **Required Header:**
  - `Retry-After: 60`
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: 1648000000`

---

### Streaming-Specific Status Code Guidelines

#### During Stream Errors

When an error occurs **after** streaming has started (status code already sent):

1. **Chunked Transfer Encoding:**
   - Send error chunk with error metadata
   - Close connection
   - Cannot change status code

2. **SSE:**
   - Send error event
   - Client receives error via EventSource error event
   - Client auto-reconnects if configured

3. **WebSocket:**
   - Send error frame
   - Close with status code (1011 for unexpected condition)

4. **NDJSON:**
   - Send error JSON object
   - Close stream
   - Client must handle error object

**Example SSE Error:**
```
event: error
data: {"error": "Database connection lost", "code": "DB_ERROR"}

```

**Example NDJSON Error:**
```json
{"error": true, "code": "STREAM_ERROR", "message": "Processing failed at record 1500"}
```

---

## Spring Boot Implementation Patterns

### Pattern 1: Chunked Streaming with StreamingResponseBody

**Best for:** Large files, generated content, database result streaming

```java
@RestController
@RequestMapping("/api/v1/stream")
public class ChunkedStreamController {
    
    private final DataService dataService;
    
    @GetMapping(value = "/export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> exportData(
        @RequestParam(required = false) Long lastId,
        HttpServletResponse response) {
        
        response.setHeader("Content-Disposition", "attachment; filename=export.dat");
        response.setHeader("X-Content-Type-Options", "nosniff");
        
        StreamingResponseBody stream = outputStream -> {
            try (Stream<DataRecord> dataStream = dataService.streamFromDatabase(lastId)) {
                dataStream.forEach(record -> {
                    try {
                        byte[] bytes = serializeRecord(record);
                        outputStream.write(bytes);
                        outputStream.flush(); // Force chunk send
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                });
            } catch (Exception e) {
                log.error("Streaming error", e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stream failed");
            }
        };
        
        return ResponseEntity.ok(stream);
    }
}
```

---

### Pattern 2: Server-Sent Events with WebFlux

**Best for:** Real-time updates, progress monitoring, notifications

```java
@RestController
@RequestMapping("/api/v1/sse")
public class SseController {
    
    private final JobService jobService;
    
    @GetMapping(value = "/job/{jobId}/progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<JobProgress>> streamJobProgress(@PathVariable String jobId) {
        return jobService.getProgressStream(jobId)
            .map(progress -> ServerSentEvent.<JobProgress>builder()
                .id(String.valueOf(progress.getStep()))
                .event("progress")
                .data(progress)
                .retry(Duration.ofSeconds(5))
                .comment("Job progress update")
                .build())
            .doOnComplete(() -> log.info("Progress stream completed for job {}", jobId))
            .doOnError(e -> log.error("Progress stream error for job {}", jobId, e))
            .onErrorResume(e -> Flux.just(
                ServerSentEvent.<JobProgress>builder()
                    .event("error")
                    .data(new JobProgress(jobId, -1, "Error: " + e.getMessage()))
                    .build()
            ));
    }
    
    @GetMapping(value = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Notification>> streamNotifications(
        @RequestHeader("Last-Event-ID") Optional<String> lastEventId) {
        
        Long startId = lastEventId.map(Long::parseLong).orElse(0L);
        
        return notificationService.getNotificationStream(startId)
            .map(notification -> ServerSentEvent.<Notification>builder()
                .id(String.valueOf(notification.getId()))
                .event("notification")
                .data(notification)
                .build());
    }
}
```

---

### Pattern 3: Reactive NDJSON Streaming

**Best for:** Bulk exports, log streaming, ETL pipelines

```java
@RestController
@RequestMapping("/api/v1/ndjson")
public class NdjsonStreamController {
    
    private final DataRepository dataRepository;
    private final ObjectMapper objectMapper;
    
    @GetMapping(value = "/records", produces = "application/x-ndjson")
    public Flux<String> streamRecords(
        @RequestParam(required = false) Long sinceTimestamp,
        @RequestParam(defaultValue = "1000") int batchSize) {
        
        return dataRepository.streamRecords(sinceTimestamp)
            .buffer(batchSize)
            .flatMap(batch -> Flux.fromIterable(batch)
                .map(record -> {
                    try {
                        return objectMapper.writeValueAsString(record) + "\n";
                    } catch (JsonProcessingException e) {
                        log.error("Serialization error", e);
                        return null;
                    }
                })
                .filter(Objects::nonNull))
            .onBackpressureBuffer(10000, BufferOverflowStrategy.ERROR)
            .doOnError(e -> log.error("NDJSON streaming error", e))
            .onErrorResume(e -> Flux.just(
                "{\"error\": true, \"message\": \"" + e.getMessage() + "\"}\n"
            ));
    }
}
```

---

### Pattern 4: Range Request Support

**Best for:** Large files, video/audio, resumable downloads

```java
@RestController
@RequestMapping("/api/v1/files")
public class RangeRequestController {
    
    private final FileStorageService storageService;
    
    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFile(
        @PathVariable String fileId,
        @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
        @RequestHeader(value = HttpHeaders.IF_RANGE, required = false) String ifRangeHeader) {
        
        FileMetadata metadata = storageService.getMetadata(fileId);
        Resource resource = storageService.getResource(fileId);
        long fileSize = metadata.getSize();
        String etag = metadata.getEtag();
        
        // Check If-Range condition
        if (ifRangeHeader != null && !ifRangeHeader.equals(etag)) {
            // Condition failed, return full content
            rangeHeader = null;
        }
        
        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            // Full content
            return ResponseEntity.ok()
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.ETAG, etag)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .body(resource);
        }
        
        // Parse range
        try {
            HttpRange range = HttpRange.parseRanges(rangeHeader).get(0);
            long start = range.getRangeStart(fileSize);
            long end = range.getRangeEnd(fileSize);
            long rangeLength = end - start + 1;
            
            Resource rangeResource = new RangeResource(resource, start, rangeLength);
            
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.CONTENT_RANGE, 
                    String.format("bytes %d-%d/%d", start, end, fileSize))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.ETAG, etag)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(rangeLength))
                .contentType(MediaType.parseMediaType(metadata.getContentType()))
                .body(rangeResource);
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.RANGE_NOT_SATISFIABLE)
                .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileSize)
                .build();
        }
    }
}

// Custom Resource wrapper for range support
class RangeResource extends InputStreamResource {
    public RangeResource(Resource delegate, long start, long length) throws IOException {
        super(new RangeInputStream(delegate.getInputStream(), start, length));
    }
}

class RangeInputStream extends FilterInputStream {
    private final long length;
    private long bytesRead = 0;
    
    public RangeInputStream(InputStream in, long start, long length) throws IOException {
        super(in);
        this.length = length;
        in.skip(start);
    }
    
    @Override
    public int read() throws IOException {
        if (bytesRead >= length) return -1;
        int result = super.read();
        if (result != -1) bytesRead++;
        return result;
    }
    
    @Override
    public int read(byte[] b, int off, int len) throws IOException {
        if (bytesRead >= length) return -1;
        int maxRead = (int) Math.min(len, length - bytesRead);
        int result = super.read(b, off, maxRead);
        if (result > 0) bytesRead += result;
        return result;
    }
}
```

---

### Pattern 5: WebFlux with Backpressure

**Best for:** High-throughput systems, reactive microservices

```java
@RestController
@RequestMapping("/api/v1/reactive")
public class ReactiveStreamController {
    
    private final ReactiveDataService dataService;
    
    @GetMapping(value = "/stream", produces = MediaType.APPLICATION_STREAM_JSON_VALUE)
    public Flux<DataChunk> streamWithBackpressure(
        @RequestParam(defaultValue = "1000") int bufferSize,
        @RequestParam(defaultValue = "100") long delayMillis) {
        
        return dataService.generateStream()
            .onBackpressureBuffer(bufferSize, 
                dropped -> log.warn("Dropped item due to backpressure: {}", dropped),
                BufferOverflowStrategy.DROP_OLDEST)
            .delayElements(Duration.ofMillis(delayMillis))
            .doOnNext(chunk -> log.trace("Emitting: {}", chunk.getId()))
            .doOnComplete(() -> log.info("Stream completed"))
            .doOnError(e -> log.error("Stream error", e))
            .onErrorResume(e -> {
                if (e instanceof BufferOverflowException) {
                    return Flux.error(new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE, 
                        "Backpressure overflow - client too slow"));
                }
                return Flux.error(new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Stream processing failed"));
            })
            .timeout(Duration.ofMinutes(30))
            .doFinally(signal -> log.info("Stream terminated with signal: {}", signal));
    }
}
```

---

### Pattern 6: Error Handling & Recovery

```java
@RestController
@RequestMapping("/api/v1/resilient")
public class ResilientStreamController {
    
    @GetMapping(value = "/stream", produces = MediaType.APPLICATION_STREAM_JSON_VALUE)
    public Flux<DataChunk> streamWithRecovery() {
        return dataService.getDataStream()
            // Retry transient failures
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                .filter(throwable -> throwable instanceof TransientException)
                .doAfterRetry(signal -> log.warn("Retrying after error: {}", 
                    signal.failure().getMessage())))
            
            // Timeout individual items
            .timeout(Duration.ofSeconds(10), Flux.empty())
            
            // Handle errors gracefully
            .onErrorResume(TimeoutException.class, e -> {
                log.error("Stream timeout", e);
                return Flux.just(DataChunk.error("Timeout occurred"));
            })
            .onErrorResume(DatabaseException.class, e -> {
                log.error("Database error", e);
                return Flux.just(DataChunk.error("Database temporarily unavailable"));
            })
            
            // Circuit breaker pattern
            .transform(CircuitBreakerOperator.of(circuitBreaker))
            
            // Fallback to cached data
            .onErrorResume(e -> {
                log.error("All recovery failed, using cache", e);
                return cacheService.getCachedStream();
            });
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleStreamError(ResponseStatusException e) {
        return ResponseEntity
            .status(e.getStatusCode())
            .header("Retry-After", "60")
            .body(new ErrorResponse(e.getReason(), e.getStatusCode().value()));
    }
}
```

---

## Recommendations & Best Practices

### 1. Choose the Right Technique

| Requirement | Recommended Technique | Alternative |
|-------------|----------------------|-------------|
| Large file download | Chunked + Range Requests | WebFlux Flux |
| Real-time notifications | SSE | WebSocket |
| Bidirectional communication | WebSocket | gRPC |
| Bulk data export | NDJSON + Chunked | Reactive Flux |
| Video/audio streaming | Range Requests | HLS/DASH |
| Microservice communication | gRPC | WebFlux |
| Progress updates | SSE | Long polling |
| High-throughput data | Reactive Streams | gRPC |

---

### 2. Performance Optimization

**Buffer Management:**
```java
// Configure appropriate buffer sizes
Flux.fromStream(dataStream)
    .buffer(1000)  // Batch for efficiency
    .onBackpressureBuffer(10000, BufferOverflowStrategy.DROP_LATEST)
```

**Connection Pooling:**
```java
@Bean
public ReactiveDataSource reactiveDataSource() {
    ConnectionPoolConfiguration config = ConnectionPoolConfiguration.builder()
        .maxSize(20)
        .initialSize(5)
        .maxIdleTime(Duration.ofMinutes(30))
        .build();
    
    return new PostgresqlConnectionFactory(
        PostgresqlConnectionConfiguration.builder()
            .host("localhost")
            .database("mydb")
            .username("user")
            .password("pass")
            .build())
        .create();
}
```

**Timeouts:**
```java
Flux.fromStream(dataStream)
    .timeout(Duration.ofMinutes(30))  // Overall timeout
    .take(Duration.ofMinutes(29))     // Alternative: time-based limit
```

---

### 3. Security Considerations

**Rate Limiting:**
```java
@Component
public class StreamRateLimiter {
    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();
    
    public boolean allowRequest(String clientId) {
        RateLimiter limiter = limiters.computeIfAbsent(
            clientId, 
            k -> RateLimiter.create(10.0) // 10 requests/second
        );
        return limiter.tryAcquire();
    }
}

@GetMapping("/stream")
public Flux<Data> stream(@RequestHeader("X-Client-ID") String clientId) {
    if (!rateLimiter.allowRequest(clientId)) {
        throw new ResponseStatusException(
            HttpStatus.TOO_MANY_REQUESTS, 
            "Rate limit exceeded");
    }
    return dataService.stream();
}
```

**Authentication:**
```java
@GetMapping(value = "/secure-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<Data>> secureStream(Authentication auth) {
    String userId = auth.getName();
    
    return dataService.streamForUser(userId)
        .map(data -> ServerSentEvent.<Data>builder()
            .data(data)
            .build())
        .doOnSubscribe(s -> log.info("User {} subscribed", userId))
        .doOnCancel(() -> log.info("User {} unsubscribed", userId));
}
```

**Input Validation:**
```java
@GetMapping("/stream")
public Flux<Data> stream(
    @RequestParam @Min(1) @Max(10000) int limit,
    @RequestParam @Pattern(regexp = "^[a-zA-Z0-9_-]+$") String filter) {
    
    validateAndSanitize(filter);
    return dataService.stream(limit, filter);
}
```

---

### 4. Monitoring & Observability

**Metrics:**
```java
@Component
public class StreamMetrics {
    private final MeterRegistry registry;
    
    public Flux<Data> instrumentedStream(Flux<Data> source) {
        Counter successCounter = registry.counter("stream.items.success");
        Counter errorCounter = registry.counter("stream.items.error");
        Timer timer = registry.timer("stream.duration");
        
        return source
            .doOnNext(data -> successCounter.increment())
            .doOnError(e -> errorCounter.increment())
            .doOnComplete(() -> timer.record(() -> {}))
            .name("data-stream")
            .metrics();
    }
}
```

**Logging:**
```java
Flux.fromStream(dataStream)
    .doOnSubscribe(s -> log.info("Stream started"))
    .doOnNext(item -> log.debug("Processing item: {}", item.getId()))
    .doOnError(e -> log.error("Stream error", e))
    .doOnComplete(() -> log.info("Stream completed"))
    .doOnCancel(() -> log.warn("Stream cancelled by client"))
    .doFinally(signal -> log.info("Stream terminated: {}", signal))
```

---

### 5. Testing Strategies

**Unit Testing:**
```java
@Test
void testStreamEmitsAllItems() {
    Flux<Data> stream = controller.streamData();
    
    StepVerifier.create(stream)
        .expectNextCount(100)
        .verifyComplete();
}

@Test
void testStreamHandlesBackpressure() {
    Flux<Data> stream = controller.streamData();
    
    StepVerifier.create(stream, 10) // Request 10 items
        .expectNextCount(10)
        .thenRequest(10)
        .expectNextCount(10)
        .thenCancel()
        .verify();
}
```

**Integration Testing:**
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class StreamIntegrationTest {
    
    @Autowired
    private WebTestClient webClient;
    
    @Test
    void testSseStream() {
        webClient.get()
            .uri("/stream/sse")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus().isOk()
            .returnResult(ServerSentEvent.class)
            .getResponseBody()
            .take(10)
            .collectList()
            .block();
    }
}
```

---

### 6. Error Recovery Patterns

**Circuit Breaker:**
```java
@Bean
public CircuitBreaker streamCircuitBreaker() {
    return CircuitBreaker.of("stream-service", CircuitBreakerConfig.custom()
        .failureRateThreshold(50)
        .waitDurationInOpenState(Duration.ofSeconds(30))
        .slidingWindowSize(10)
        .build());
}
```

**Fallback:**
```java
Flux<Data> stream = dataService.getStream()
    .onErrorResume(e -> cacheService.getCachedStream())
    .onErrorResume(e -> Flux.just(Data.placeholder()));
```

---

## Decision Matrix

### Streaming Technique Selection Guide

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STREAMING TECHNIQUE SELECTOR                     │
└─────────────────────────────────────────────────────────────────────┘

Use Case: Large File Download (>100MB)
├─ Need resume capability? → YES → Range Requests + Chunked
└─ Need resume capability? → NO  → Chunked Transfer Encoding

Use Case: Real-time Updates
├─ Bidirectional? → YES → WebSocket
└─ Bidirectional? → NO
   ├─ Browser client? → YES → Server-Sent Events
   └─ Browser client? → NO  → NDJSON or gRPC

Use Case: Bulk Data Export
├─ Structured data? → YES → NDJSON + Reactive Streams
└─ Structured data? → NO  → Chunked + Custom Format

Use Case: Video/Audio Streaming
└─ Always use → Range Requests (or HLS/DASH for adaptive)

Use Case: Microservice Communication
├─ High performance required? → YES → gRPC Streaming
└─ High performance required? → NO  → WebFlux Reactive Streams

Use Case: Progress Monitoring
└─ Use → Server-Sent Events

Use Case: Log Streaming
└─ Use → NDJSON + Chunked

Use Case: Chat/Collaboration
└─ Use → WebSocket
```

---

### Protocol Comparison Matrix

| Feature | Chunked | SSE | WebSocket | Range | NDJSON | gRPC | WebFlux |
|---------|---------|-----|-----------|-------|--------|------|---------|
| **Bidirectional** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Binary Data** | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Browser Support** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| **Auto Reconnect** | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| **Backpressure** | ⚠️ | ❌ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ |
| **Resume Support** | ❌ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Overhead** | Low | Low | Low | Low | Low | Low | Low |
| **Setup Complexity** | Low | Low | Med | Low | Low | High | Med |
| **Firewall Friendly** | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |

Legend: ✅ Full Support | ⚠️ Partial Support | ❌ No Support

---

## Summary

### Key Takeaways

1. **For large file transfers**: Use Chunked Transfer Encoding with optional Range Request support for resumability

2. **For real-time updates**: Use Server-Sent Events (SSE) for unidirectional or WebSocket for bidirectional

3. **For bulk data exports**: Use NDJSON format with Reactive Streams for memory efficiency and backpressure

4. **For microservices**: Use gRPC streaming or Spring WebFlux for high-performance inter-service communication

5. **For video/audio**: Always implement Range Request support (HTTP 206)

### Status Code Best Practices

- **200 OK**: Standard streaming success
- **206 Partial Content**: Range requests only
- **202 Accepted**: Async job initiation
- **413 Payload Too Large**: Size limit exceeded
- **429 Too Many Requests**: Rate limiting
- **503 Service Unavailable**: Backpressure/overload (with Retry-After)
- **500 Internal Server Error**: Stream processing failure

### Spring Boot Recommendations

1. Use **Spring WebFlux** for reactive streaming with backpressure
2. Use **StreamingResponseBody** for servlet-based chunked streaming
3. Implement **Range Request** support for large files
4. Use **Server-Sent Events** for real-time browser updates
5. Add comprehensive **error handling** and **monitoring**
6. Implement **rate limiting** and **timeouts**
7. Use **circuit breakers** for resilience

---

## References

- [RFC 7233 - HTTP Range Requests](https://tools.ietf.org/html/rfc7233)
- [RFC 7230 - HTTP/1.1 Message Syntax and Routing](https://tools.ietf.org/html/rfc7230)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [WebSocket Protocol (RFC 6455)](https://tools.ietf.org/html/rfc6455)
- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html)
- [Reactive Streams Specification](https://www.reactive-streams.org/)
- [gRPC Documentation](https://grpc.io/docs/)

---

**Document Version:** 1.0  
**Last Updated:** March 22, 2026  
**Maintained by:** Principal Software Engineering Team

