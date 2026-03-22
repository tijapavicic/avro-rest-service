package com.example.avro.bulkimport.consumer.repository;

import com.example.avro.bulkimport.consumer.model.DataRecord;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Reactive repository for {@link DataRecord} entities.
 *
 * @author Principal Engineering Team
 * @since 0.0.2
 */
@Repository
public interface DataRecordRepository extends ReactiveMongoRepository<DataRecord, String> {
    
    /**
     * Find all records by import job ID.
     *
     * @param importJobId the import job ID
     * @return flux of data records
     */
    Flux<DataRecord> findByImportJobId(String importJobId);
    
    /**
     * Count records by import job ID.
     *
     * @param importJobId the import job ID
     * @return mono of count
     */
    reactor.core.publisher.Mono<Long> countByImportJobId(String importJobId);
}

