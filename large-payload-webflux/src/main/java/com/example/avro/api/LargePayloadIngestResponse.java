package com.example.avro.api;

public record LargePayloadIngestResponse(
        String scenarionID,
        String systemId,
        String date,
        long itemsProcessed
) {
}

