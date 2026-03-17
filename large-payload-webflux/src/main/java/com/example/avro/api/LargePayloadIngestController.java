package com.example.avro.api;

import com.example.avro.service.LargePayloadIngestService;
import com.example.avro.service.PayloadTooLargeException;
import com.example.avro.service.PayloadValidationException;
import com.example.avro.service.UnsupportedPayloadEncodingException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/api/payloads")
public class LargePayloadIngestController {

    private final LargePayloadIngestService ingestService;
    private final long maxDecompressedBytes;

    public LargePayloadIngestController(
            LargePayloadIngestService ingestService,
            @Value("${app.payload.ingest.max-decompressed-bytes:1200000000}") long maxDecompressedBytes
    ) {
        this.ingestService = ingestService;
        this.maxDecompressedBytes = maxDecompressedBytes;
    }

    @PostMapping(path = "/ingest-gzip", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<LargePayloadIngestResponse>> ingestGzip(ServerHttpRequest request) {
        return readRequestBody(request)
                .flatMap(body -> Mono.fromCallable(() -> {
                    try (InputStream bounded = openRequiredGzipStream(request, body)) {
                        LargePayloadIngestResponse response = ingestService.ingest(bounded);
                        return ResponseEntity.accepted().body(response);
                    } catch (ZipException ex) {
                        throw new PayloadValidationException("Malformed gzip stream");
                    } catch (IOException ex) {
                        throw new PayloadValidationException("Malformed or truncated gzip JSON payload");
                    }
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    @PostMapping(path = "/ingest-ndjson", consumes = "application/x-ndjson", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<LargePayloadIngestResponse>> ingestNdjson(ServerHttpRequest request) {
        String contentEncoding = request.getHeaders().getFirst(HttpHeaders.CONTENT_ENCODING);
        boolean gzipEncoded = isGzipEncoding(contentEncoding);

        return readRequestBody(request)
                .flatMap(body -> Mono.fromCallable(() -> {
                    try (InputStream bounded = openNdjsonStream(contentEncoding, body)) {
                        LargePayloadIngestResponse response = ingestService.ingestNdjson(bounded);
                        return ResponseEntity.accepted().body(response);
                    } catch (ZipException ex) {
                        throw new PayloadValidationException("Malformed gzip stream");
                    } catch (IOException ex) {
                        if (gzipEncoded) {
                            throw new PayloadValidationException("Malformed or truncated gzip NDJSON payload");
                        }
                        throw new PayloadValidationException("Malformed NDJSON payload");
                    }
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    private InputStream openRequiredGzipStream(ServerHttpRequest request, byte[] body) throws IOException {
        String contentEncoding = request.getHeaders().getFirst(HttpHeaders.CONTENT_ENCODING);
        if (!isGzipEncoding(contentEncoding)) {
            throw new UnsupportedPayloadEncodingException("Content-Encoding 'gzip' is required");
        }
        return new MaxBytesInputStream(new GZIPInputStream(new ByteArrayInputStream(body)), maxDecompressedBytes);
    }

    private InputStream openNdjsonStream(String contentEncoding, byte[] body) throws IOException {
        if (contentEncoding == null || contentEncoding.isBlank() || isIdentityEncoding(contentEncoding)) {
            return new MaxBytesInputStream(new ByteArrayInputStream(body), maxDecompressedBytes);
        }
        if (isGzipEncoding(contentEncoding)) {
            return new MaxBytesInputStream(new GZIPInputStream(new ByteArrayInputStream(body)), maxDecompressedBytes);
        }
        throw new UnsupportedPayloadEncodingException("Only 'gzip' or no Content-Encoding is supported for NDJSON ingestion");
    }

    private Mono<byte[]> readRequestBody(ServerHttpRequest request) {
        return request.getBody()
                .handle((DataBuffer buffer, reactor.core.publisher.SynchronousSink<byte[]> sink) -> {
                    int readableBytes = buffer.readableByteCount();
                    if (readableBytes <= 0) {
                        DataBufferUtils.release(buffer);
                        return;
                    }
                    byte[] chunk = new byte[readableBytes];
                    buffer.read(chunk);
                    DataBufferUtils.release(buffer);
                    sink.next(chunk);
                })
                .collectList()
                .map(chunks -> {
                    long total = 0L;
                    for (byte[] chunk : chunks) {
                        total += chunk.length;
                        if (total > maxDecompressedBytes) {
                            throw new PayloadTooLargeException("Payload exceeds limit of " + maxDecompressedBytes + " bytes");
                        }
                    }

                    ByteArrayOutputStream out = new ByteArrayOutputStream((int) total);
                    for (byte[] chunk : chunks) {
                        out.write(chunk, 0, chunk.length);
                    }
                    return out.toByteArray();
                });
    }

    private boolean isGzipEncoding(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            return false;
        }
        String normalized = headerValue.toLowerCase(Locale.ROOT);
        return normalized.contains("gzip");
    }

    private boolean isIdentityEncoding(String headerValue) {
        return "identity".equalsIgnoreCase(headerValue.trim());
    }

    private static final class MaxBytesInputStream extends FilterInputStream {

        private final long maxBytes;
        private long bytesRead;

        private MaxBytesInputStream(InputStream in, long maxBytes) {
            super(in);
            this.maxBytes = maxBytes;
        }

        @Override
        public int read() throws IOException {
            int value = super.read();
            if (value != -1) {
                track(1);
            }
            return value;
        }

        @Override
        public int read(@NonNull byte[] b, int off, int len) throws IOException {
            if (len == 0) {
                return 0;
            }
            int read = super.read(b, off, len);
            if (read > 0) {
                track(read);
            }
            return read;
        }

        private void track(int delta) {
            bytesRead += delta;
            if (bytesRead > maxBytes) {
                throw new PayloadTooLargeException("Decompressed payload exceeds limit of " + maxBytes + " bytes");
            }
        }
    }
}

