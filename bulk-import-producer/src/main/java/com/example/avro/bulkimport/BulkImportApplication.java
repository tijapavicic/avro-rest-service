package com.example.avro.bulkimport;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

/**
 * Main application class for Bulk CSV Import Service.
 * 
 * <p>This Spring Boot application provides async CSV import capabilities
 * for large datasets (500K+ rows) using reactive streams and MongoDB.</p>
 * 
 * <h2>Key Features:</h2>
 * <ul>
 *   <li>Reactive stream processing (Spring WebFlux)</li>
 *   <li>Memory-efficient CSV parsing</li>
 *   <li>Backpressure-aware database writes</li>
 *   <li>Async job status tracking</li>
 *   <li>Producer-consumer architecture</li>
 * </ul>
 * 
 * <h2>Architecture:</h2>
 * <pre>
 * Client → Producer (Accept Upload) → Consumer (Process & Persist) → MongoDB
 * </pre>
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@SpringBootApplication(scanBasePackages = {
    "com.example.avro.bulkimport",
    "com.example.avro.bulkimport.consumer"
})
@EnableReactiveMongoRepositories(basePackages = {
    "com.example.avro.bulkimport.repository",
    "com.example.avro.bulkimport.consumer.repository"
})
public class BulkImportApplication {
    
    /**
     * Main method to start the Spring Boot application.
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(BulkImportApplication.class, args);
    }
}

