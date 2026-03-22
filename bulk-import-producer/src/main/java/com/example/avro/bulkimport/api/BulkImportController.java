package com.example.avro.bulkimport.api;

import com.example.avro.bulkimport.model.ImportJob;
import com.example.avro.bulkimport.model.ImportResponse;
import com.example.avro.bulkimport.service.CsvImportService;
import com.example.avro.bulkimport.service.ImportJobService;
import io.micrometer.core.annotation.Timed;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * REST controller for bulk CSV import operations.
 * 
 * <p>This controller handles async CSV file uploads for large datasets (500K+ rows).
 * It follows the producer pattern by accepting uploads, validating files, and initiating
 * background processing without blocking the client.</p>
 * 
 * <h2>Endpoints:</h2>
 * <ul>
 *   <li>POST /api/v1/import/csv - Upload and process CSV file</li>
 *   <li>GET /api/v1/import/jobs/{jobId} - Get job status</li>
 *   <li>GET /api/v1/import/jobs - List all jobs</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/import")
@RequiredArgsConstructor
public class BulkImportController {
    
    private final CsvImportService csvImportService;
    private final ImportJobService importJobService;
    
    /**
     * Upload and process a CSV file asynchronously.
     * 
     * <p>This endpoint accepts a multipart/form-data CSV file upload and initiates
     * background processing. The client receives an immediate 202 Accepted response
     * with a job ID for status tracking.</p>
     * 
     * <h3>Request Example:</h3>
     * <pre>
     * curl -X POST http://localhost:8080/api/v1/import/csv \
     *   -F "file=@data.csv" \
     *   -H "Authorization: Bearer token"
     * </pre>
     * 
     * <h3>Response Example:</h3>
     * <pre>
     * {
     *   "jobId": "65a1b2c3d4e5f6789abcdef0",
     *   "status": "PENDING",
     *   "message": "Import job created successfully",
     *   "statusUrl": "/api/v1/import/jobs/65a1b2c3d4e5f6789abcdef0",
     *   "estimatedRows": 500000,
     *   "timestamp": "2026-03-22T10:30:00"
     * }
     * </pre>
     *
     * @param filePart the CSV file part from multipart request
     * @return Mono of ResponseEntity containing import response
     */
    @PostMapping(
        value = "/csv",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    @Timed(value = "import.csv.upload", description = "Time taken to upload CSV file")
    public Mono<ResponseEntity<ImportResponse>> uploadCsv(
            @RequestPart("file") @NotNull FilePart filePart) {
        
        log.info("Received CSV upload request: filename={}, size={}", 
            filePart.filename(), 
            filePart.headers().getContentLength());
        
        return csvImportService.initiateImport(filePart)
            .map(importJob -> {
                ImportResponse response = ImportResponse.builder()
                    .jobId(importJob.getId())
                    .status(importJob.getStatus())
                    .message("Import job created successfully")
                    .statusUrl("/api/v1/import/jobs/" + importJob.getId())
                    .estimatedRows(importJob.getTotalRows())
                    .build();
                
                log.info("Import job created: jobId={}, filename={}", 
                    importJob.getId(), 
                    importJob.getFilename());
                
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
            })
            .onErrorResume(e -> {
                log.error("Error initiating CSV import", e);
                ImportResponse errorResponse = ImportResponse.builder()
                    .status(null)
                    .message("Failed to initiate import: " + e.getMessage())
                    .build();
                return Mono.just(ResponseEntity.badRequest().body(errorResponse));
            });
    }
    
    /**
     * Get the status of an import job.
     * 
     * <h3>Response Example:</h3>
     * <pre>
     * {
     *   "id": "65a1b2c3d4e5f6789abcdef0",
     *   "filename": "data.csv",
     *   "status": "PROCESSING",
     *   "totalRows": 500000,
     *   "processedRows": 250000,
     *   "failedRows": 10,
     *   "createdAt": "2026-03-22T10:30:00",
     *   "startedAt": "2026-03-22T10:30:05"
     * }
     * </pre>
     *
     * @param jobId the import job ID
     * @return Mono of ResponseEntity containing import job details
     */
    @GetMapping(value = "/jobs/{jobId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed(value = "import.job.status", description = "Time taken to retrieve job status")
    public Mono<ResponseEntity<ImportJob>> getJobStatus(@PathVariable String jobId) {
        log.debug("Retrieving job status: jobId={}", jobId);
        
        return importJobService.getJob(jobId)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build())
            .onErrorResume(e -> {
                log.error("Error retrieving job status: jobId={}", jobId, e);
                return Mono.just(ResponseEntity.internalServerError().build());
            });
    }
    
    /**
     * List all import jobs (optionally filtered by user).
     * 
     * @param userId optional user ID filter
     * @return ResponseEntity containing list of import jobs
     */
    @GetMapping(value = "/jobs", produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed(value = "import.jobs.list", description = "Time taken to list jobs")
    public Mono<ResponseEntity<Object>> listJobs(
            @RequestParam(required = false) String userId) {
        
        log.debug("Listing import jobs: userId={}", userId);
        
        return importJobService.listJobs(userId)
            .collectList()
            .map(ResponseEntity::ok)
            .onErrorResume(e -> {
                log.error("Error listing jobs", e);
                return Mono.just(ResponseEntity.internalServerError().build());
            });
    }
}

