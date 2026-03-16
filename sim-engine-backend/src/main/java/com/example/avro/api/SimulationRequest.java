package com.example.avro.api;

import java.time.Instant;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payload for submitting a new simulation job.
 */
public class SimulationRequest {

    @NotBlank(message = "systemId is required")
    @Size(max = 100, message = "systemId must be at most 100 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "systemId may contain only letters, digits, underscore, and hyphen")
    private String systemId;

    @NotNull(message = "requestedAt is required")
    @PastOrPresent(message = "requestedAt cannot be in the future")
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

