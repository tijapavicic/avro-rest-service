package com.example.avro.api;

import java.time.Instant;

/**
 * Request payload for submitting a new simulation job.
 */
public class SimulationRequest {

    private String systemId;
    private Instant requestedAt;

    public SimulationRequest() {}

    public SimulationRequest(String systemId, Instant requestedAt) {
        this.systemId = systemId;
        this.requestedAt = requestedAt;
    }

    public String getSystemId() {
        return systemId;
    }

    public void setSystemId(String systemId) {
        this.systemId = systemId;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }
}

