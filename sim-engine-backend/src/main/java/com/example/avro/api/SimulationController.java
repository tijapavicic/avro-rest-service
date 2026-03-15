package com.example.avro.api;

import java.time.Instant;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for simulation job submission.
 * Accepts POST /api/simulations and returns an accepted job ID with SUBMITTED status.
 */
@RestController
@RequestMapping("/api/simulations")
public class SimulationController {

    @PostMapping
    public ResponseEntity<SimulationResponse> submit(@RequestBody SimulationRequest request) {
        String jobId = "JOB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        SimulationResponse response = new SimulationResponse(
                jobId,
                "SUBMITTED",
                request.getSystemId(),
                Instant.now()
        );
        return ResponseEntity.accepted().body(response);
    }
}

