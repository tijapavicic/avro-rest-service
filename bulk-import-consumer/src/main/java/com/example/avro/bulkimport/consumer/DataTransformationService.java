package com.example.avro.bulkimport.consumer;

import com.example.avro.bulkimport.consumer.model.DataRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Service for transforming and manipulating CSV data according to business rules.
 * 
 * <p>This is where you implement your specific data transformation logic.
 * Examples include:</p>
 * <ul>
 *   <li>Data cleansing (trim, normalize)</li>
 *   <li>Data enrichment (lookup, calculate)</li>
 *   <li>Format conversion</li>
 *   <li>Business logic application</li>
 * </ul>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Slf4j
@Service
public class DataTransformationService {
    
    /**
     * Transform a data record according to business rules.
     * 
     * <p><strong>Example transformations (customize for your needs):</strong></p>
     * <pre>
     * - Uppercase column1
     * - Parse column2 as date
     * - Calculate derived column10 from column3 + column4
     * - Enrich with external data
     * </pre>
     *
     * @param record the record to transform
     * @return Mono of transformed record
     */
    public Mono<DataRecord> transform(DataRecord record) {
        return Mono.fromCallable(() -> {
            log.trace("Transforming record at line {}", record.getLineNumber());
            
            // Example transformation 1: Normalize text fields
            if (record.getColumn1() != null) {
                record.setColumn1(record.getColumn1().trim().toUpperCase());
            }
            
            if (record.getColumn2() != null) {
                record.setColumn2(record.getColumn2().trim());
            }
            
            // Example transformation 2: Data cleansing
            if (record.getColumn3() != null) {
                // Remove special characters
                record.setColumn3(record.getColumn3().replaceAll("[^a-zA-Z0-9\\s]", ""));
            }
            
            // Example transformation 3: Calculation
            if (record.getColumn4() != null && record.getColumn5() != null) {
                try {
                    double val4 = Double.parseDouble(record.getColumn4());
                    double val5 = Double.parseDouble(record.getColumn5());
                    double result = val4 + val5;
                    record.setColumn10(String.valueOf(result));
                } catch (NumberFormatException e) {
                    log.warn("Cannot calculate column10 at line {}: invalid numbers", 
                        record.getLineNumber());
                }
            }
            
            // Example transformation 4: Set default values
            if (record.getColumn6() == null || record.getColumn6().isEmpty()) {
                record.setColumn6("DEFAULT");
            }
            
            // Example transformation 5: Format standardization
            if (record.getColumn7() != null) {
                // Standardize date format, phone format, etc.
                record.setColumn7(standardizeFormat(record.getColumn7()));
            }
            
            // Add processing status
            record.setProcessingStatus("TRANSFORMED");
            
            log.trace("Record transformed successfully: line {}", record.getLineNumber());
            return record;
        })
        .onErrorResume(e -> {
            log.error("Error transforming record at line {}", record.getLineNumber(), e);
            record.setProcessingStatus("TRANSFORM_ERROR");
            record.setNotes("Transformation error: " + e.getMessage());
            return Mono.just(record);
        });
    }
    
    /**
     * Example helper method for format standardization.
     * Replace with your actual logic.
     */
    private String standardizeFormat(String value) {
        // Example: Convert date from MM/DD/YYYY to YYYY-MM-DD
        // Example: Format phone numbers
        // Example: Standardize postal codes
        return value; // Replace with actual logic
    }
    
    /**
     * Example enrichment method that could call external services.
     * 
     * <p>For real implementations, consider:</p>
     * <ul>
     *   <li>Caching lookups to reduce external calls</li>
     *   <li>Circuit breakers for resilience</li>
     *   <li>Timeout handling</li>
     * </ul>
     */
    public Mono<DataRecord> enrichWithExternalData(DataRecord record) {
        // Example: Lookup additional data from external API or database
        // return webClient.get()
        //     .uri("/lookup/" + record.getColumn1())
        //     .retrieve()
        //     .bodyToMono(EnrichmentData.class)
        //     .map(data -> {
        //         record.setColumn9(data.getValue());
        //         return record;
        //     });
        
        return Mono.just(record);
    }
}

