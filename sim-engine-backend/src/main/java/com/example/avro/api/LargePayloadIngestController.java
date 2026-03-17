package com.example.avro.api;

import com.example.avro.service.LargePayloadIngestService;
import com.example.avro.service.PayloadTooLargeException;
import com.example.avro.service.PayloadValidationException;
import com.example.avro.service.UnsupportedPayloadEncodingException;
import jakarta.servlet.http.HttpServletRequest;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint for large payload ingestion using gzip + stream parsing.
 */
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

    @PostMapping(path = "/ingest-gzip", consumes = "application/json", produces = "application/json")
    public ResponseEntity<LargePayloadIngestResponse> ingestGzip(HttpServletRequest request) throws IOException {
        try (InputStream bounded = openRequiredGzipStream(request)) {
            LargePayloadIngestResponse response = ingestService.ingest(bounded);
            return ResponseEntity.accepted().body(response);
        } catch (ZipException ex) {
            throw new PayloadValidationException("Malformed gzip stream");
        } catch (IOException ex) {
            throw new PayloadValidationException("Malformed or truncated gzip JSON payload");
        }
    }

    @PostMapping(path = "/ingest-ndjson", consumes = "application/x-ndjson", produces = "application/json")
    public ResponseEntity<LargePayloadIngestResponse> ingestNdjson(HttpServletRequest request) throws IOException {
        String contentEncoding = request.getHeader("Content-Encoding");
        boolean gzipEncoded = isGzipEncoding(contentEncoding);
        try (InputStream bounded = openNdjsonStream(request)) {
            LargePayloadIngestResponse response = ingestService.ingestNdjson(bounded);
            return ResponseEntity.accepted().body(response);
        } catch (ZipException ex) {
            throw new PayloadValidationException("Malformed gzip stream");
        } catch (IOException ex) {
            if (gzipEncoded) {
                throw new PayloadValidationException("Malformed or truncated gzip NDJSON payload");
            }
            throw ex;
        }
    }

    private InputStream openRequiredGzipStream(HttpServletRequest request) throws IOException {
        String contentEncoding = request.getHeader("Content-Encoding");
        if (!isGzipEncoding(contentEncoding)) {
            throw new UnsupportedPayloadEncodingException("Content-Encoding 'gzip' is required");
        }
        return new MaxBytesInputStream(new GZIPInputStream(request.getInputStream()), maxDecompressedBytes);
    }

    private InputStream openNdjsonStream(HttpServletRequest request) throws IOException {
        String contentEncoding = request.getHeader("Content-Encoding");
        if (contentEncoding == null || contentEncoding.isBlank() || isIdentityEncoding(contentEncoding)) {
            return new MaxBytesInputStream(request.getInputStream(), maxDecompressedBytes);
        }
        if (isGzipEncoding(contentEncoding)) {
            return new MaxBytesInputStream(new GZIPInputStream(request.getInputStream()), maxDecompressedBytes);
        }
        throw new UnsupportedPayloadEncodingException("Only 'gzip' or no Content-Encoding is supported for NDJSON ingestion");
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

