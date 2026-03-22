package com.example.avro.bulkimport.consumer;

import com.example.avro.bulkimport.consumer.model.DataRecord;
import com.example.avro.bulkimport.consumer.repository.DataRecordRepository;
import io.github.resilience4j.reactor.retry.RetryOperator;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for persisting data records to the database with batching and error handling.
 * 
 * <p>This service implements:</p>
 * <ul>
 *   <li>Batch persistence for database efficiency</li>
 *   <li>Retry logic for transient failures</li>
 *   <li>Error tracking and logging</li>
 *   <li>Backpressure-aware database writes</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
public class DataPersistenceService {
    
    private final DataRecordRepository dataRecordRepository;
    private final Retry retry;
    
    public DataPersistenceService(DataRecordRepository dataRecordRepository) {
        this.dataRecordRepository = dataRecordRepository;
        
        // Configure retry strategy for database operations
        RetryConfig retryConfig = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofSeconds(2))
            .retryExceptions(
                org.springframework.dao.TransientDataAccessException.class,
                java.net.ConnectException.class
            )
            .build();
        
        this.retry = Retry.of("dataPersistence", retryConfig);
    }
    
    /**
     * Persist a batch of data records to the database.
     * 
     * <p>This method saves records in batches for optimal database performance.
     * Failed records are logged but don't stop the entire batch.</p>
     *
     * @param jobId the import job ID
     * @param batch the batch of records to persist
     * @return Mono of saved records list
     */
    public Mono<List<DataRecord>> persistBatch(String jobId, List<DataRecord> batch) {
        log.debug("Persisting batch: jobId={}, size={}", jobId, batch.size());
        
        // Set job ID and timestamp for all records
        batch.forEach(record -> {
            record.setImportJobId(jobId);
            record.setImportedAt(LocalDateTime.now());
        });
        
        return Flux.fromIterable(batch)
            .flatMap(record -> 
                dataRecordRepository.save(record)
                    .transformDeferred(RetryOperator.of(retry))
                    .timeout(Duration.ofSeconds(30))
                    .onErrorResume(e -> {
                        log.error("Failed to save record at line {}: {}", 
                            record.getLineNumber(), e.getMessage());
                        // Return empty to skip this record but continue processing
                        return Mono.empty();
                    }),
                10 // Concurrency of 10 for DB writes
            )
            .collectList()
            .doOnSuccess(saved -> 
                log.info("Batch persisted successfully: jobId={}, saved={}/{}", 
                    jobId, saved.size(), batch.size()))
            .doOnError(e -> 
                log.error("Error persisting batch: jobId={}", jobId, e));
    }
    
    /**
     * Persist records using saveAll for better batch performance.
     * 
     * <p>Alternative method using Spring Data's saveAll which may be more
     * efficient for large batches.</p>
     */
    public Mono<List<DataRecord>> persistBatchBulk(String jobId, List<DataRecord> batch) {
        log.debug("Bulk persisting batch: jobId={}, size={}", jobId, batch.size());
        
        // Set job ID and timestamp for all records
        batch.forEach(record -> {
            record.setImportJobId(jobId);
            record.setImportedAt(LocalDateTime.now());
        });
        
        return dataRecordRepository.saveAll(batch)
            .transformDeferred(RetryOperator.of(retry))
            .timeout(Duration.ofSeconds(60))
            .collectList()
            .doOnSuccess(saved -> 
                log.info("Bulk batch persisted: jobId={}, size={}", jobId, saved.size()))
            .doOnError(e -> 
                log.error("Error bulk persisting batch: jobId={}", jobId, e))
            .onErrorResume(e -> {
                // Fallback to individual saves if bulk fails
                log.warn("Bulk save failed, falling back to individual saves");
                return persistBatch(jobId, batch);
            });
    }
    
    /**
     * Get all records for a specific import job.
     *
     * @param jobId the import job ID
     * @return Flux of data records
     */
    public Flux<DataRecord> getRecordsByJobId(String jobId) {
        return dataRecordRepository.findByImportJobId(jobId);
    }
    
    /**
     * Count records for a specific import job.
     *
     * @param jobId the import job ID
     * @return Mono of record count
     */
    public Mono<Long> countRecordsByJobId(String jobId) {
        return dataRecordRepository.countByImportJobId(jobId);
    }
}

