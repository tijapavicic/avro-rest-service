package com.example.avro.bulkimport.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for import initiation requests.
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResponse {
    
    /**
     * Unique job ID for tracking the import.
     */
    private String jobId;
    
    /**
     * Current status of the job.
     */
    private ImportStatus status;
    
    /**
     * Message describing the response.
     */
    private String message;
    
    /**
     * Timestamp of the response.
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * URL to check job status.
     */
    private String statusUrl;
    
    /**
     * Estimated total rows (if available from initial scan).
     */
    private Long estimatedRows;
}

