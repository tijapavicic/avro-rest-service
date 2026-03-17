package com.example.avro.api;

/**
 * Response payload returned after a large request is streamed and validated.
 */
public record LargePayloadIngestResponse(
        String scenarionID,
        String systemId,
        String date,
        long itemsProcessed
) {
}

