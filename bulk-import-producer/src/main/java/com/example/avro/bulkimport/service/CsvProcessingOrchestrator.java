package com.example.avro.bulkimport.service;

import com.example.avro.bulkimport.consumer.CsvStreamProcessor;
import com.example.avro.bulkimport.consumer.DataPersistenceService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;

/**
 * Orchestrator service that coordinates CSV processing workflow.
 * 
 * <p>This service bridges the producer and consumer modules by:</p>
 * <ul>
 *   <li>Receiving file upload from producer</li>
 *   <li>Delegating to CSV stream processor</li>
 *   <li>Coordinating with persistence service</li>
 *   <li>Updating job status throughout lifecycle</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CsvProcessingOrchestrator {
    
    private final ImportJobService importJobService;
    private final CsvStreamProcessor csvStreamProcessor;
    private final DataPersistenceService dataPersistenceService;
    private final MeterRegistry meterRegistry;
    
    /**
     * Process CSV file asynchronously.
     * 
     * <p>This method executes the entire processing pipeline on a separate
     * scheduler to avoid blocking the HTTP request thread.</p>
     *
     * @param jobId the import job ID
     * @param filePart the CSV file to process
     * @return Mono that completes when processing finishes
     */
    public Mono<Void> processAsync(String jobId, FilePart filePart) {
        log.info("Starting async processing: jobId={}, filename={}", jobId, filePart.filename());
        
        Counter recordsProcessed = meterRegistry.counter("csv.records.processed", "job", jobId);
        Counter recordsFailed = meterRegistry.counter("csv.records.failed", "job", jobId);
        Timer.Sample timer = Timer.start(meterRegistry);
        
        return Mono.defer(() -> {
            // Update job status to PROCESSING
            return importJobService.startProcessing(jobId)
                .then(Mono.defer(() -> {
                    // Process CSV stream
                    return csvStreamProcessor.parseAndTransform(filePart)
                        .doOnNext(record -> log.trace("Record parsed: {}", record.getId()))
                        .buffer(1000) // Batch records for efficiency
                        .flatMap(batch -> 
                            dataPersistenceService.persistBatch(jobId, batch)
                                .doOnNext(saved -> recordsProcessed.increment(saved.size()))
                                .doOnError(e -> recordsFailed.increment(batch.size()))
                                .onErrorResume(e -> {
                                    log.error("Error persisting batch for job {}", jobId, e);
                                    return Mono.empty();
                                }),
                            3 // Max 3 concurrent batches
                        )
                        .doOnNext(savedBatch -> {
                            // Update progress periodically
                            long processed = (long) recordsProcessed.count();
                            long failed = (long) recordsFailed.count();
                            importJobService.updateProgress(jobId, processed, failed)
                                .subscribe();
                        })
                        .then();
                }))
                .then(Mono.defer(() -> {
                    // Mark job as completed
                    long processed = (long) recordsProcessed.count();
                    long failed = (long) recordsFailed.count();
                    
                    timer.stop(meterRegistry.timer("csv.processing.duration", "job", jobId));
                    
                    return importJobService.completeJob(jobId, processed, failed)
                        .then();
                }))
                .doOnSuccess(v -> log.info("Processing completed successfully: jobId={}", jobId))
                .onErrorResume(e -> {
                    log.error("Processing failed for job: {}", jobId, e);
                    return importJobService.failJob(jobId, e.getMessage())
                        .then();
                });
        })
        .subscribeOn(Schedulers.boundedElastic()) // Execute on separate thread pool
        .timeout(Duration.ofHours(2)) // 2-hour timeout for large files
        .then();
    }
}

