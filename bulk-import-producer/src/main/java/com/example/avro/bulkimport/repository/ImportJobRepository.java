package com.example.avro.bulkimport.repository;

import com.example.avro.bulkimport.model.ImportJob;
import com.example.avro.bulkimport.model.ImportStatus;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Reactive repository for {@link ImportJob} entities.
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Repository
public interface ImportJobRepository extends ReactiveMongoRepository<ImportJob, String> {
    
    /**
     * Find all jobs by status.
     *
     * @param status the import status
     * @return flux of import jobs
     */
    Flux<ImportJob> findByStatus(ImportStatus status);
    
    /**
     * Find all jobs by user ID.
     *
     * @param userId the user ID
     * @return flux of import jobs
     */
    Flux<ImportJob> findByUserId(String userId);
}

