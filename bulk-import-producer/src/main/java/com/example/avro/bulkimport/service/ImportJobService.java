package com.example.avro.bulkimport.service;

import com.example.avro.bulkimport.model.ImportJob;
import com.example.avro.bulkimport.model.ImportStatus;
import com.example.avro.bulkimport.repository.ImportJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Service for managing import job lifecycle and status.
 * 
 * <p>Provides CRUD operations for import jobs and status updates.</p>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImportJobService {
    
    private final ImportJobRepository importJobRepository;
    
    /**
     * Create a new import job.
     *
     * @param job the import job to create
     * @return Mono of created import job
     */
    public Mono<ImportJob> createJob(ImportJob job) {
        log.info("Creating import job: filename={}", job.getFilename());
        return importJobRepository.save(job)
            .doOnSuccess(savedJob -> log.info("Import job created: id={}", savedJob.getId()))
            .doOnError(e -> log.error("Failed to create import job", e));
    }
    
    /**
     * Get an import job by ID.
     *
     * @param jobId the job ID
     * @return Mono of import job
     */
    public Mono<ImportJob> getJob(String jobId) {
        return importJobRepository.findById(jobId)
            .doOnSuccess(job -> {
                if (job != null) {
                    log.debug("Retrieved job: id={}, status={}", jobId, job.getStatus());
                } else {
                    log.warn("Job not found: id={}", jobId);
                }
            });
    }
    
    /**
     * Update job status to PROCESSING and set started timestamp.
     *
     * @param jobId the job ID
     * @return Mono of updated job
     */
    public Mono<ImportJob> startProcessing(String jobId) {
        return importJobRepository.findById(jobId)
            .flatMap(job -> {
                job.setStatus(ImportStatus.PROCESSING);
                job.setStartedAt(LocalDateTime.now());
                return importJobRepository.save(job);
            })
            .doOnSuccess(job -> log.info("Job processing started: id={}", jobId));
    }
    
    /**
     * Update job progress (processed and failed row counts).
     *
     * @param jobId the job ID
     * @param processedRows number of processed rows
     * @param failedRows number of failed rows
     * @return Mono of updated job
     */
    public Mono<ImportJob> updateProgress(String jobId, Long processedRows, Long failedRows) {
        return importJobRepository.findById(jobId)
            .flatMap(job -> {
                job.setProcessedRows(processedRows);
                job.setFailedRows(failedRows);
                return importJobRepository.save(job);
            })
            .doOnSuccess(job -> 
                log.debug("Job progress updated: id={}, processed={}, failed={}", 
                    jobId, processedRows, failedRows));
    }
    
    /**
     * Mark job as completed successfully.
     *
     * @param jobId the job ID
     * @param processedRows total processed rows
     * @param failedRows total failed rows
     * @return Mono of completed job
     */
    public Mono<ImportJob> completeJob(String jobId, Long processedRows, Long failedRows) {
        return importJobRepository.findById(jobId)
            .flatMap(job -> {
                job.setProcessedRows(processedRows);
                job.setFailedRows(failedRows);
                job.setCompletedAt(LocalDateTime.now());
                
                if (failedRows > 0) {
                    job.setStatus(ImportStatus.COMPLETED_WITH_ERRORS);
                    log.warn("Job completed with errors: id={}, failed={}", jobId, failedRows);
                } else {
                    job.setStatus(ImportStatus.COMPLETED);
                    log.info("Job completed successfully: id={}", jobId);
                }
                
                return importJobRepository.save(job);
            });
    }
    
    /**
     * Mark job as failed with error message.
     *
     * @param jobId the job ID
     * @param errorMessage the error message
     * @return Mono of failed job
     */
    public Mono<ImportJob> failJob(String jobId, String errorMessage) {
        return importJobRepository.findById(jobId)
            .flatMap(job -> {
                job.setStatus(ImportStatus.FAILED);
                job.setErrorMessage(errorMessage);
                job.setCompletedAt(LocalDateTime.now());
                return importJobRepository.save(job);
            })
            .doOnSuccess(job -> log.error("Job failed: id={}, error={}", jobId, errorMessage));
    }
    
    /**
     * List all jobs, optionally filtered by user ID.
     *
     * @param userId optional user ID filter
     * @return Flux of import jobs
     */
    public Flux<ImportJob> listJobs(String userId) {
        if (userId != null && !userId.isEmpty()) {
            return importJobRepository.findByUserId(userId);
        }
        return importJobRepository.findAll();
    }
    
    /**
     * List jobs by status.
     *
     * @param status the import status
     * @return Flux of import jobs
     */
    public Flux<ImportJob> listJobsByStatus(ImportStatus status) {
        return importJobRepository.findByStatus(status);
    }
}

