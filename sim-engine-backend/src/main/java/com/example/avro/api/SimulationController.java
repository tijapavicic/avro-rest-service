package com.example.avro.api;

import io.micrometer.core.annotation.Timed;
import java.time.Instant;
import java.util.UUID;

import com.example.avro.config.TrafficLoggingInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(SimulationController.class);

    @PostMapping
    @Timed(value = "simulation.submit", description = "Time taken to submit a simulation job")
    public ResponseEntity<SimulationResponse> submit(@Valid @RequestBody SimulationRequest request, HttpServletRequest httpRequest) {
        log.info("Simulation submit received: systemId={}", request.getSystemId());
        httpRequest.setAttribute(TrafficLoggingInterceptor.SYSTEM_ID_ATTRIBUTE, request.getSystemId());
        String jobId = "JOB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        SimulationResponse response = new SimulationResponse(
                jobId,
                "SUBMITTED",
                request.getSystemId(),
                Instant.now()
        );
        log.info("Simulation submitted: jobId={}, systemId={}", jobId, request.getSystemId());
        return ResponseEntity.accepted().body(response);
    }
}
