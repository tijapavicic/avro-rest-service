package com.example.avro.bulkimport.service;

import com.example.avro.bulkimport.model.ImportJob;
import com.example.avro.bulkimport.model.ImportStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Service for initiating CSV import operations.
 * 
 * <p>This service orchestrates the import process by:</p>
 * <ul>
 *   <li>Validating the uploaded file</li>
 *   <li>Creating an import job record</li>
 *   <li>Initiating async processing via the consumer module</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CsvImportService {
    
    private final ImportJobService importJobService;
    private final FileValidationService fileValidationService;
    private final CsvProcessingOrchestrator csvProcessingOrchestrator;
    
    /**
     * Initiate a CSV import operation.
     * 
     * <p>This method:</p>
     * <ol>
     *   <li>Validates the file (size, format, content type)</li>
     *   <li>Creates an import job record with PENDING status</li>
     *   <li>Triggers async processing (fire-and-forget)</li>
     *   <li>Returns immediately with job details</li>
     * </ol>
     *
     * @param filePart the uploaded CSV file
     * @return Mono of created import job
     */
    public Mono<ImportJob> initiateImport(FilePart filePart) {
        log.info("Initiating CSV import: filename={}", filePart.filename());
        
        // Validate file
        return fileValidationService.validate(filePart)
            .flatMap(validatedFile -> {
                // Create import job
                ImportJob job = ImportJob.builder()
                    .filename(filePart.filename())
                    .fileSizeBytes(filePart.headers().getContentLength())
                    .status(ImportStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
                
                return importJobService.createJob(job);
            })
            .flatMap(createdJob -> {
                // Trigger async processing (fire-and-forget)
                csvProcessingOrchestrator.processAsync(createdJob.getId(), filePart)
                    .subscribe(
                        result -> log.info("Processing completed for job: {}", createdJob.getId()),
                        error -> log.error("Processing failed for job: {}", createdJob.getId(), error)
                    );
                
                // Return immediately
                return Mono.just(createdJob);
            })
            .doOnSuccess(job -> log.info("Import initiated successfully: jobId={}", job.getId()))
            .doOnError(e -> log.error("Failed to initiate import", e));
    }
}

