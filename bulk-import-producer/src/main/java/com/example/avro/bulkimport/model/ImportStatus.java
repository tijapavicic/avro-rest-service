package com.example.avro.bulkimport.model;

/**
 * Status enumeration for import job lifecycle.
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
public enum ImportStatus {
    /**
     * Job has been created but processing has not started.
     */
    PENDING,
    
    /**
     * Job is currently being processed.
     */
    PROCESSING,
    
    /**
     * Job completed successfully with all records processed.
     */
    COMPLETED,
    
    /**
     * Job completed with some records failing validation or persistence.
     */
    COMPLETED_WITH_ERRORS,
    
    /**
     * Job failed catastrophically and could not complete.
     */
    FAILED,
    
    /**
     * Job was cancelled by user or admin.
     */
    CANCELLED
}

