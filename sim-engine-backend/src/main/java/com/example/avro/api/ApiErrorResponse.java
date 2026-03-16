package com.example.avro.api;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error payload used by API handlers.
 */
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        Map<String, String> details,
        String traceId,
        String requestId,
        String correlationId
) {
}

