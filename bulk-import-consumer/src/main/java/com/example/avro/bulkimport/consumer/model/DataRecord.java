package com.example.avro.bulkimport.consumer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Data record entity representing a single row from the CSV file.
 * 
 * <p>This entity contains the 10 columns from the CSV plus metadata fields
 * for tracking and auditing purposes.</p>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "data_records")
public class DataRecord {
    
    /**
     * Unique identifier for the record.
     */
    @Id
    private String id;
    
    /**
     * Reference to the import job that created this record.
     */
    private String importJobId;
    
    /**
     * Line number in the original CSV file.
     */
    private Long lineNumber;
    
    // CSV Columns (10 columns as per requirement)
    private String column1;
    private String column2;
    private String column3;
    private String column4;
    private String column5;
    private String column6;
    private String column7;
    private String column8;
    private String column9;
    private String column10;
    
    /**
     * Timestamp when the record was imported.
     */
    @Builder.Default
    private LocalDateTime importedAt = LocalDateTime.now();
    
    /**
     * Status of the record (for tracking processing state if needed).
     */
    private String processingStatus;
    
    /**
     * Any transformation or validation notes.
     */
    private String notes;
}

