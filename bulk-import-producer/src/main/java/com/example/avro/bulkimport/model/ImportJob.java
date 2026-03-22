package com.example.avro.bulkimport.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Import job entity that tracks the status and progress of CSV import operations.
 * 
 * <p>This entity is persisted in MongoDB and provides async status tracking
 * for large file imports.</p>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "import_jobs")
public class ImportJob {
    
    /**
     * Unique identifier for the import job.
     */
    @Id
    private String id;
    
    /**
     * Original filename of the uploaded CSV.
     */
    private String filename;
    
    /**
     * Total number of rows in the CSV file (excluding header).
     */
    private Long totalRows;
    
    /**
     * Number of rows successfully processed and persisted.
     */
    @Builder.Default
    private Long processedRows = 0L;
    
    /**
     * Number of rows that failed processing due to validation or persistence errors.
     */
    @Builder.Default
    private Long failedRows = 0L;
    
    /**
     * Current status of the import job.
     */
    @Builder.Default
    private ImportStatus status = ImportStatus.PENDING;
    
    /**
     * Timestamp when the job was created.
     */
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Timestamp when the job started processing.
     */
    private LocalDateTime startedAt;
    
    /**
     * Timestamp when the job completed (success or failure).
     */
    private LocalDateTime completedAt;
    
    /**
     * Error message if the job failed.
     */
    private String errorMessage;
    
    /**
     * User ID who initiated the import.
     */
    private String userId;
    
    /**
     * File size in bytes.
     */
    private Long fileSizeBytes;
    
    /**
     * Processing duration in milliseconds.
     */
    public Long getProcessingDurationMs() {
        if (startedAt == null) {
            return 0L;
        }
        LocalDateTime endTime = completedAt != null ? completedAt : LocalDateTime.now();
        return java.time.Duration.between(startedAt, endTime).toMillis();
    }
    
    /**
     * Calculate success rate as a percentage.
     */
    public Double getSuccessRate() {
        if (totalRows == null || totalRows == 0) {
            return 0.0;
        }
        return (processedRows.doubleValue() / totalRows.doubleValue()) * 100.0;
    }
}

