package com.example.avro.api;

import java.time.Instant;

/**
 * Response payload returned after a simulation job is accepted.
 */
public class SimulationResponse {

    private String jobId;
    private String status;
    private String systemId;
    private Instant acceptedAt;

    public SimulationResponse() {}

    public SimulationResponse(String jobId, String status, String systemId, Instant acceptedAt) {
        this.jobId = jobId;
        this.status = status;
        this.systemId = systemId;
        this.acceptedAt = acceptedAt;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSystemId() {
        return systemId;
    }

    public void setSystemId(String systemId) {
        this.systemId = systemId;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
}

